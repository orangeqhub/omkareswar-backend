# Frontend Integration Guide

This document explains how the OMKARESWAR REALTORS React frontend (`D:\OMKARESWAR REALTORS\src`) should be wired up to this backend. The frontend currently has no real backend calls (its `src/services/*` files simulate everything with `localStorage`) — this guide maps every existing frontend service method to the real API endpoint it should call once axios + JWT auth are introduced on the frontend.

## 1. Base configuration

```
API base URL:     http://localhost:5000/api
Uploads base URL:  http://localhost:5000/uploads
Health check URL: http://localhost:5000/api/health
Socket.IO URL:    http://localhost:5000  (same host as the API, default namespace)
```

All responses follow one of these shapes:

```jsonc
// Single resource
{ "success": true, "message": "...", "data": { ... } }

// List / paginated resource
{ "success": true, "message": "...", "data": { "items": [...], "total": 42, "page": 1, "pageSize": 20, "totalPages": 3 } }

// Error
{ "success": false, "message": "...", "code": "SOME_CODE", "errors": [{ "field": "mobile", "message": "..." }] }
```

Every protected route expects: `Authorization: Bearer <token>` (the `token` returned from any login endpoint). Tokens expire per `JWT_EXPIRES_IN` (default 7 days); use `POST /api/auth/refresh` with the stored `refreshToken` to get a new pair.

## 2. Authentication flows

| Flow | Endpoint | Notes |
|---|---|---|
| Public OTP request | `POST /api/auth/otp/request` `{mobile}` | Demo mode (`OTP_MODE=demo`) always returns OTP `1234` (also included in the response as `demoOtp` for local testing) |
| Public OTP login | `POST /api/auth/otp/verify` `{mobile,otp}` | Only succeeds for role `buyer`/`seller`/`mediator` with status `approved`/`active` |
| Admin login | `POST /api/auth/admin/login` `{loginId,password}` | |
| Employee login | `POST /api/auth/employee/login` `{employeeId,password}` | `employeeId` = the employee's `memberId` (e.g. `EMP-2026-0001`) |
| Session | `GET /api/auth/me` (Bearer) | |
| Logout | `POST /api/auth/logout` (Bearer) | Stateless JWT — this is a no-op server-side; the frontend should just discard the token |
| Refresh | `POST /api/auth/refresh` `{refreshToken}` | |

Error codes surfaced by auth: `INVALID_OTP`, `OTP_EXPIRED`, `USER_NOT_FOUND`, `ACCOUNT_PENDING`, `ACCOUNT_REJECTED`, `ACCOUNT_INACTIVE`, `ROLE_NOT_ALLOWED`, `INVALID_CREDENTIALS`.

## 3. Socket.IO integration

Connect with the JWT access token:

```js
import { io } from 'socket.io-client';
const socket = io('http://localhost:5000', { auth: { token: accessToken } });
```

On connect, the server joins the socket to two rooms automatically:
- `user:<userId>` — events targeted at this specific user
- `role:<role>` — events broadcast to every user of that role (admin / employee / buyer / seller / mediator)

### Events

| Event | Emitted when | Payload |
|---|---|---|
| `notification:new` | Any `createNotification()` call commits | The full notification row (`id,type,titleEn,titleTe,relatedType,relatedId,read,createdAt`) |
| `notification:read` | A notification (or all) is marked read | `{id}` or `{all:true}` |
| `registration:new` / `registration:updated` / `registration:assigned` | Registration workflow changes | Delivered as `notification:new` with `type` = `registration.new`/`registration.approved`/`registration.rejected`/`registration.correctionRequested`/`registration.assigned` |
| `property:submitted` / `property:updated` / `property:moderated` / `property:assigned` | Property workflow changes | Delivered as `notification:new` with `type` = `property.submitted`/`property.approve`/`property.reject`/`property.requestChanges`/`property.assigned`/`property.correctionRequested` |
| `enquiry:new` / `enquiry:updated` / `enquiry:assigned` | Enquiry workflow changes | Delivered as `notification:new` with `type` = `enquiry.new`/`enquiry.assigned` |
| `visit:new` / `visit:updated` / `visit:assigned` | Visit workflow changes | Delivered as `notification:new` with `type` = `visit.new`/`visit.updated`/`visit.assigned` |
| `followup:new` / `followup:updated` / `followup:assigned` | Follow-up workflow changes | Delivered as `notification:new` with `type` = `followup.assigned` |
| `dashboard:refresh` | Not auto-emitted; reserved for future use — frontend can simply re-fetch dashboard endpoints after receiving any `notification:new` relevant to it | — |

In practice every workflow event above is delivered through the single `notification:new` event with a `type` field describing what happened and `relatedType`/`relatedId` pointing at the affected record — the frontend should switch on `type` rather than listening for many distinct event names.

### Who listens to what

| Role | Rooms joined | Typical events of interest |
|---|---|---|
| admin | `user:<id>`, `role:admin` | All `*.new` events (new registration, new property submission, new enquiry, new visit), all employee recommendations |
| employee | `user:<id>`, `role:employee` | Assignment notifications (`registration.assigned`, `property.assigned`, `enquiry.assigned`, `visit.assigned`, `followup.assigned`) |
| seller | `user:<id>` | `enquiry.new`, `visit.new`, `property.approve`/`reject`/`requestChanges` |
| buyer | `user:<id>` | `visit.updated` |
| mediator | `user:<id>` | Assignment notifications for users/properties/enquiries/visits assigned to them |

## 4. Frontend service → backend API mapping

### authService

| Frontend method | Backend endpoint |
|---|---|
| `requestOtp(mobile)` | `POST /api/auth/otp/request` |
| `loginPublicWithOtp(mobile, otp)` | `POST /api/auth/otp/verify` |
| `loginAdmin(loginId, password)` | `POST /api/auth/admin/login` |
| `loginEmployee(employeeId, password)` | `POST /api/auth/employee/login` |
| `getSession()` | `GET /api/auth/me` |
| `logout()` | `POST /api/auth/logout` |

### registrationService

| Frontend method | Backend endpoint |
|---|---|
| `register(role, data)` | `POST /api/registrations` |
| `getApplicationStatus(mobile)` | `GET /api/registrations/status?mobile=` |
| `listPending(viewer)` | `GET /api/admin/registrations` |
| `assignEmployee(id, employeeId)` | `PATCH /api/admin/registrations/:id/assign` |
| `approve(id)` | `PATCH /api/admin/registrations/:id/approve` |
| `reject(id, reason)` | `PATCH /api/admin/registrations/:id/reject` |
| (OTP-verify-before-submit) | `POST /api/registrations/otp/request`, `POST /api/registrations/otp/verify` |
| (correction) | `PATCH /api/admin/registrations/:id/request-correction` |

### userService

| Frontend method | Backend endpoint |
|---|---|
| List users | `GET /api/users?role=&status=` |
| Get user | `GET /api/users/:id` |
| Update user | `PATCH /api/users/:id` |
| Update status | `PATCH /api/users/:id/status` |
| Create employee | `POST /api/admin/employees` |
| Update employee permissions | `PUT /api/admin/employees/:id/permissions` |
| Update employee status | `PATCH /api/admin/employees/:id/status` |
| Assign mediator | `PATCH /api/admin/users/:id/assign-mediator` |

### propertyService

| Frontend method | Backend endpoint |
|---|---|
| `list(filters)` | `GET /api/properties` (categorySlug, city, transactionType, minPrice, maxPrice, minArea, maxArea, bedrooms, bathrooms, facing, furnishing, featured, verified, sellerId, status, search, sort, page, pageSize) |
| `getById(id)` | `GET /api/properties/:id` |
| `getFeatured(limit, city)` | `GET /api/properties/featured` |
| `getLatest(limit, city)` | `GET /api/properties/latest` |
| `getRelated(id, limit)` | `GET /api/properties/:id/related` |
| `recordView(id)` | `POST /api/properties/:id/view` |
| `toggleFavourite(userId, propertyId)` | `POST /api/users/:userId/favourites/:propertyId/toggle` |
| `getFavourites(userId)` | `GET /api/users/:userId/favourites` |
| `getFavouriteIds(userId)` | `GET /api/users/:userId/favourites/ids` |
| `createDraft(sellerId, data)` | `POST /api/properties/drafts` |
| `update(id, data)` | `PATCH /api/properties/:id` |
| `submit(id)` | `POST /api/properties/:id/submit` |
| `getSellerProperties(sellerId)` | `GET /api/sellers/:sellerId/properties` |
| `moderate(id, action, note)` | `POST /api/admin/properties/:id/moderate` |
| `remove(id)` | `DELETE /api/properties/:id` |
| `assign(id, data)` | `PATCH /api/properties/:id/assign` |
| `categoryInUse(slug)` | `GET /api/categories/:slug/in-use` |
| `getMyProperties()` (seller) | `GET /api/me/properties` |
| `getMediatorProperties()` | `GET /api/mediator/properties` |
| `getEmployeeProperties()` | `GET /api/employee/properties` |
| `getAdminProperties()` | `GET /api/admin/properties` |
| approve/reject/request-changes/assign-employee/assign-mediator/feature/verify/mark-sold | `PATCH /api/admin/properties/:id/<action>` |

### propertyModerationService

| Frontend method | Backend endpoint | Permission |
|---|---|---|
| `list()` | `GET /api/employee/property-moderation` | `PROPERTY_MODERATION_VIEW` |
| `getOne(id)` | `GET /api/employee/property-moderation/:id` | `PROPERTY_MODERATION_VIEW` |
| `start(id)` | `POST /api/employee/property-moderation/:id/start` | `PROPERTY_MODERATION_VIEW` |
| `addNote(id, note)` | `POST /api/employee/property-moderation/:id/add-note` | `PROPERTY_MODERATION_VIEW` |
| `requestChanges(id, data)` | `POST /api/employee/property-moderation/:id/request-changes` | `PROPERTY_MODERATION_CORRECTION_REQUEST` |
| `recommendApproval(id)` | `POST /api/employee/property-moderation/:id/recommend-approval` | `PROPERTY_MODERATION_RECOMMEND` |
| `recommendRejection(id)` | `POST /api/employee/property-moderation/:id/recommend-rejection` | `PROPERTY_MODERATION_RECOMMEND` |
| `complete(id)` | `POST /api/employee/property-moderation/:id/complete` | `PROPERTY_MODERATION_VIEW` |

### verificationService (user verification)

| Frontend method | Backend endpoint | Permission |
|---|---|---|
| `list()` | `GET /api/employee/user-verification` | `USER_VERIFICATION_VIEW` |
| `getOne(userId)` | `GET /api/employee/user-verification/:userId` | `USER_VERIFICATION_VIEW` |
| `startReview(userId)` | `POST /api/employee/user-verification/:userId/start-review` | `USER_VERIFICATION_VIEW` |
| `correctionRequest(userId, data)` | `POST /api/employee/user-verification/:userId/correction-request` | `USER_VERIFICATION_CORRECTION_REQUEST` |
| `recommendApproval(userId)` | `POST /api/employee/user-verification/:userId/recommend-approval` | `USER_VERIFICATION_RECOMMEND` |
| `recommendRejection(userId)` | `POST /api/employee/user-verification/:userId/recommend-rejection` | `USER_VERIFICATION_RECOMMEND` |
| `complete(userId)` | `POST /api/employee/user-verification/:userId/complete` | `USER_VERIFICATION_VIEW` |

### enquiryService

| Frontend method | Backend endpoint |
|---|---|
| `create(data)` | `POST /api/enquiries` |
| `getSellerEnquiries(sellerId)` | `GET /api/sellers/:sellerId/enquiries` |
| `getAdminEnquiries()` | `GET /api/admin/enquiries` |
| `getEmployeeEnquiries()` | `GET /api/employee/enquiries` (permission `ENQUIRY_VIEW`) |
| `getOne(id)` | `GET /api/enquiries/:id` |
| `getBuyerEnquiries(phone)` | `GET /api/buyers/enquiries?phone=` |
| `updateStatus(id, status)` | `PATCH /api/enquiries/:id/status` |
| `updatePriority(id, priority)` | `PATCH /api/enquiries/:id/priority` (permission `ENQUIRY_UPDATE`) |
| `updateNextFollowUp(id, date)` | `PATCH /api/enquiries/:id/next-follow-up` |
| `complete(id)` | `PATCH /api/enquiries/:id/complete` |
| `assignEmployee(id, employeeId)` | `PATCH /api/admin/enquiries/:id/assign-employee` |
| `assignMediator(id, mediatorId)` | `PATCH /api/admin/enquiries/:id/assign-mediator` |

### callNoteService

| Frontend method | Backend endpoint |
|---|---|
| `list(enquiryId)` | `GET /api/enquiries/:id/call-notes` |
| `create(enquiryId, data)` | `POST /api/enquiries/:id/call-notes` (permission `CALL_NOTES_MANAGE`) |
| `update(id, data)` | `PATCH /api/call-notes/:id` |
| `remove(id)` | `DELETE /api/call-notes/:id` |

### visitService

| Frontend method | Backend endpoint |
|---|---|
| `create(data)` | `POST /api/visits` |
| `getMyVisits()` (buyer) | `GET /api/me/visits` |
| `getSellerVisits()` | `GET /api/seller/visits` |
| `getMediatorVisits()` | `GET /api/mediator/visits` |
| `getEmployeeVisits()` | `GET /api/employee/visits` (permission `VISIT_VIEW`) |
| `getAdminVisits()` | `GET /api/admin/visits` |
| `confirm(id)` | `POST /api/visits/:id/confirm` (permission `VISIT_UPDATE`) |
| `reschedule(id, data)` | `PATCH /api/visits/:id/reschedule` |
| `complete(id)` | `POST /api/visits/:id/complete` |
| `cancel(id, note)` | `POST /api/visits/:id/cancel` |
| `noShow(id, note)` | `POST /api/visits/:id/no-show` |
| `addNote(id, note)` | `POST /api/visits/:id/add-note` |
| `setOutcome(id, outcome)` | `POST /api/visits/:id/outcome` |
| `assign(id, data)` | `PATCH /api/admin/visits/:id/assign` |

### followUpService

| Frontend method | Backend endpoint |
|---|---|
| `getEmployeeFollowUps()` | `GET /api/employee/follow-ups` (permission `FOLLOWUP_VIEW`) |
| `getAdminFollowUps()` | `GET /api/admin/follow-ups` |
| `create(data)` | `POST /api/follow-ups` (permission `FOLLOWUP_MANAGE`) |
| `start(id)` | `POST /api/follow-ups/:id/start` |
| `reschedule(id, data)` | `PATCH /api/follow-ups/:id/reschedule` |
| `complete(id, note)` | `POST /api/follow-ups/:id/complete` |
| `cancel(id, note)` | `POST /api/follow-ups/:id/cancel` |
| `addNote(id, note)` | `POST /api/follow-ups/:id/add-note` |
| `assign(id, data)` | `PATCH /api/admin/follow-ups/:id/assign` |

### favourites / savedSearches

| Frontend method | Backend endpoint |
|---|---|
| Favourites CRUD | `GET/POST /api/favourites`, `DELETE /api/favourites/:propertyId` |
| Saved searches CRUD | `GET/POST /api/saved-searches`, `DELETE /api/saved-searches/:id` |

### notificationService

| Frontend method | Backend endpoint |
|---|---|
| `getMine()` | `GET /api/notifications/me` |
| `markRead(id)` | `PATCH /api/notifications/:id/read` |
| `markAllRead()` | `PATCH /api/notifications/read-all` |

### employeeTaskService (dashboard)

| Frontend method | Backend endpoint |
|---|---|
| `getDashboard()` | `GET /api/employee/dashboard` (permission `EMPLOYEE_DASHBOARD_VIEW`) — real SQL aggregation, shape: `{counts:{...}, sections:{...}, workCompletion:{...}}` |

### categoryService

| Frontend method | Backend endpoint |
|---|---|
| `list()` (public) | `GET /api/categories` |
| Admin CRUD | `GET/POST/PATCH/DELETE /api/admin/categories[/:slug]` |
| `reorder(slug, direction)` | `PATCH /api/admin/categories/:slug/reorder` |

### mediaRuleService

| Frontend method | Backend endpoint |
|---|---|
| `getAll()` (admin) | `GET /api/admin/media-rules` |
| `getByRuleKey(ruleKey)` | `GET /api/media-rules/:ruleKey` |
| `update(ruleKey, data)` | `PATCH /api/admin/media-rules/:ruleKey` |
| `restoreDefaults(ruleKey)` | `POST /api/admin/media-rules/:ruleKey/restore-defaults` |
| Common slots CRUD | `POST/DELETE/PATCH /api/admin/media-rules/:ruleKey/common-slots[/:slotId]` |
| Extra spaces CRUD | `POST/DELETE /api/admin/media-rules/:ruleKey/extra-spaces[/:key]` |

### cmsService / settingsService

| Frontend method | Backend endpoint |
|---|---|
| `getCms()` | `GET /api/cms` |
| `updateCms(data)` | `PATCH /api/admin/cms` |
| `getSettings()` | `GET /api/admin/settings` (permission `ADMIN_SETTINGS_VIEW`, admin only) |
| `updateSettings(data)` | `PATCH /api/admin/settings` |

### internalNoteService

| Frontend method | Backend endpoint |
|---|---|
| `list(recordType, recordId)` | `GET /api/internal-notes?recordType=&recordId=` (permission `INTERNAL_NOTES_VIEW`) |
| `create(data)` | `POST /api/internal-notes` (permission `INTERNAL_NOTES_MANAGE`) |
| `update(id, text)` | `PATCH /api/internal-notes/:id` (owner or admin) |
| `remove(id)` | `DELETE /api/internal-notes/:id` (owner or admin) |

### auditLogService

| Frontend method | Backend endpoint |
|---|---|
| `list()` | `GET /api/admin/audit-logs` (admin only, read-only) |

### Uploads

| Purpose | Endpoint |
|---|---|
| Profile photo | `POST /api/uploads/profile` (multipart `file`) |
| Identity proof | `POST /api/uploads/identity-proof` |
| Property image | `POST /api/uploads/property-image` |
| Property document | `POST /api/uploads/property-document` |
| CMS image | `POST /api/uploads/cms-image` |
| Delete a file | `DELETE /api/uploads/:id` where `:id` is the URL-encoded relative path returned by the upload (e.g. `%2Fuploads%2Fproperties%2Fabc.jpg`) |

### Dashboards

| Role | Endpoint |
|---|---|
| admin | `GET /api/admin/dashboard` |
| employee | `GET /api/employee/dashboard` |
| buyer | `GET /api/buyer/dashboard` |
| seller | `GET /api/seller/dashboard` |
| mediator | `GET /api/mediator/dashboard` |

### Reports (Excel)

`GET /api/admin/reports/{users,properties,enquiries,visits,follow-ups,commissions}.xlsx` (permission `REPORTS_VIEW`, query-param filters like `?status=`/`?role=`/`?categorySlug=`).

## 5. Employee permission reference

Exact permission strings (case-sensitive) an admin can assign to an employee via `PUT /api/admin/employees/:id/permissions`:

```
EMPLOYEE_DASHBOARD_VIEW, USER_VERIFICATION_VIEW, USER_VERIFICATION_RECOMMEND,
USER_VERIFICATION_CORRECTION_REQUEST, PROPERTY_MODERATION_VIEW, PROPERTY_MODERATION_RECOMMEND,
PROPERTY_MODERATION_CORRECTION_REQUEST, ENQUIRY_VIEW, ENQUIRY_UPDATE, CALL_NOTES_MANAGE,
VISIT_VIEW, VISIT_UPDATE, FOLLOWUP_VIEW, FOLLOWUP_MANAGE, NOTIFICATIONS_VIEW,
INTERNAL_NOTES_VIEW, INTERNAL_NOTES_MANAGE, REPORTS_VIEW, VIEW_UNASSIGNED_RECORDS, EMPLOYEE_MANAGE
```

`ADMIN_SETTINGS_VIEW` exists but is never assignable to employees — only the `admin` role can access `/api/admin/settings`.

By default an employee only sees records assigned to them (`assignedEmployeeId = employee.id`). Granting `VIEW_UNASSIGNED_RECORDS` lets them see everything in that module regardless of assignment.
