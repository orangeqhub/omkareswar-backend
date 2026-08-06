// One-off generator for docs/OMKARESWAR-REALTORS.postman_collection.json
// Run with: node scripts/generate-postman.mjs
import fs from 'fs';

function req(name, method, url, { auth, body, query } = {}) {
  const item = {
    name,
    request: {
      method,
      header: [{ key: 'Content-Type', value: 'application/json' }],
      url: {
        raw: `{{baseUrl}}${url}${query ? '?' + query : ''}`,
        host: ['{{baseUrl}}'],
        path: url.split('/').filter(Boolean),
        ...(query ? { query: query.split('&').map((p) => { const [key, value] = p.split('='); return { key, value }; }) } : {}),
      },
    },
  };
  if (auth) {
    item.request.header.push({ key: 'Authorization', value: `Bearer {{${auth}}}` });
  }
  if (body) {
    item.request.body = { mode: 'raw', raw: JSON.stringify(body, null, 2) };
  }
  return item;
}

const folders = [
  {
    name: 'Health',
    item: [req('Health check', 'GET', '/api/health')],
  },
  {
    name: 'Auth',
    item: [
      req('Request OTP (public)', 'POST', '/api/auth/otp/request', { body: { mobile: '9000000004' } }),
      req('Verify OTP - public login', 'POST', '/api/auth/otp/verify', { body: { mobile: '9000000004', otp: '1234' } }),
      req('Admin login', 'POST', '/api/auth/admin/login', { body: { loginId: 'ADMIN001', password: 'Admin@123' } }),
      req('Employee login', 'POST', '/api/auth/employee/login', { body: { employeeId: 'EMP-2026-0001', password: 'Employee@123' } }),
      req('Get session (me)', 'GET', '/api/auth/me', { auth: 'adminToken' }),
      req('Refresh token', 'POST', '/api/auth/refresh', { body: { refreshToken: '{{refreshToken}}' } }),
      req('Logout', 'POST', '/api/auth/logout', { auth: 'adminToken' }),
    ],
  },
  {
    name: 'Registrations',
    item: [
      req('Request registration OTP', 'POST', '/api/registrations/otp/request', { body: { mobile: '9123456789' } }),
      req('Verify registration OTP', 'POST', '/api/registrations/otp/verify', { body: { mobile: '9123456789', otp: '1234' } }),
      req('Submit registration', 'POST', '/api/registrations', {
        body: {
          role: 'buyer',
          name: 'New Buyer',
          mobile: '9123456789',
          password: 'Passw0rd!',
          district: 'Hyderabad',
          city: 'Hyderabad',
          address: '1-1-1 Test Colony',
        },
      }),
      req('Get application status', 'GET', '/api/registrations/status', { query: 'mobile=9123456789' }),
      req('List pending registrations (admin/employee)', 'GET', '/api/admin/registrations', { auth: 'adminToken' }),
      req('Assign employee to registration', 'PATCH', '/api/admin/registrations/:id/assign', {
        auth: 'adminToken',
        body: { employeeId: '{{employeeId}}' },
      }),
      req('Approve registration', 'PATCH', '/api/admin/registrations/:id/approve', { auth: 'adminToken' }),
      req('Reject registration', 'PATCH', '/api/admin/registrations/:id/reject', { auth: 'adminToken', body: { reason: 'Incomplete documents' } }),
      req('Request correction', 'PATCH', '/api/admin/registrations/:id/request-correction', {
        auth: 'adminToken',
        body: { reason: 'Please upload a clearer ID proof', fields: ['idProof'] },
      }),
    ],
  },
  {
    name: 'Users & Employees',
    item: [
      req('List users', 'GET', '/api/users', { auth: 'adminToken', query: 'role=buyer' }),
      req('Get user by id', 'GET', '/api/users/:id', { auth: 'adminToken' }),
      req('Update user', 'PATCH', '/api/users/:id', { auth: 'adminToken', body: { city: 'Warangal' } }),
      req('Update user status', 'PATCH', '/api/users/:id/status', { auth: 'adminToken', body: { status: 'inactive' } }),
      req('Create employee', 'POST', '/api/admin/employees', {
        auth: 'adminToken',
        body: {
          name: 'New Employee',
          mobile: '9199999999',
          password: 'Employee@123',
          email: 'new.employee@example.com',
          city: 'Hyderabad',
          permissions: ['ENQUIRY_VIEW', 'ENQUIRY_UPDATE'],
        },
      }),
      req('Update employee permissions', 'PUT', '/api/admin/employees/:id/permissions', {
        auth: 'adminToken',
        body: { permissions: ['ENQUIRY_VIEW', 'VISIT_VIEW'] },
      }),
      req('Update employee status', 'PATCH', '/api/admin/employees/:id/status', { auth: 'adminToken', body: { status: 'inactive' } }),
      req('Assign mediator to user', 'PATCH', '/api/admin/users/:id/assign-mediator', {
        auth: 'adminToken',
        body: { mediatorId: '{{mediatorId}}' },
      }),
    ],
  },
  {
    name: 'Categories',
    item: [
      req('List public categories', 'GET', '/api/categories'),
      req('Category in-use check', 'GET', '/api/categories/:slug/in-use'),
      req('List all categories (admin)', 'GET', '/api/admin/categories', { auth: 'adminToken' }),
      req('Get category', 'GET', '/api/admin/categories/:slug', { auth: 'adminToken' }),
      req('Create category', 'POST', '/api/admin/categories', {
        auth: 'adminToken',
        body: { slug: 'test-category', ruleKey: 'apartment', nameEn: 'Test Category' },
      }),
      req('Update category', 'PATCH', '/api/admin/categories/:slug', { auth: 'adminToken', body: { nameEn: 'Updated Name' } }),
      req('Delete category', 'DELETE', '/api/admin/categories/:slug', { auth: 'adminToken' }),
      req('Reorder category', 'PATCH', '/api/admin/categories/:slug/reorder', { auth: 'adminToken', body: { direction: 'up' } }),
    ],
  },
  {
    name: 'Media Rules',
    item: [
      req('Get media rule by ruleKey', 'GET', '/api/media-rules/:ruleKey', { auth: 'sellerToken' }),
      req('List all media rules (admin)', 'GET', '/api/admin/media-rules', { auth: 'adminToken' }),
      req('Update media rule', 'PATCH', '/api/admin/media-rules/:ruleKey', { auth: 'adminToken', body: { countBasedSlots: [] } }),
      req('Restore defaults', 'POST', '/api/admin/media-rules/:ruleKey/restore-defaults', { auth: 'adminToken' }),
      req('Add common slot', 'POST', '/api/admin/media-rules/:ruleKey/common-slots', {
        auth: 'adminToken',
        body: { slotKey: 'customSlot', labelEn: 'Custom Slot', required: false },
      }),
      req('Update common slot', 'PATCH', '/api/admin/media-rules/:ruleKey/common-slots/:slotId', {
        auth: 'adminToken',
        body: { required: true },
      }),
      req('Delete common slot', 'DELETE', '/api/admin/media-rules/:ruleKey/common-slots/:slotId', { auth: 'adminToken' }),
      req('Add extra space', 'POST', '/api/admin/media-rules/:ruleKey/extra-spaces', {
        auth: 'adminToken',
        body: { key: 'customSpace', labelEn: 'Custom Space' },
      }),
      req('Delete extra space', 'DELETE', '/api/admin/media-rules/:ruleKey/extra-spaces/:key', { auth: 'adminToken' }),
    ],
  },
  {
    name: 'Properties',
    item: [
      req('List properties (filters)', 'GET', '/api/properties', { query: 'city=Hyderabad&sort=newest&page=1&pageSize=10' }),
      req('Get property by id', 'GET', '/api/properties/:id'),
      req('Featured properties', 'GET', '/api/properties/featured', { query: 'limit=8' }),
      req('Latest properties', 'GET', '/api/properties/latest', { query: 'limit=8' }),
      req('Related properties', 'GET', '/api/properties/:id/related', { query: 'limit=4' }),
      req('Record property view', 'POST', '/api/properties/:id/view'),
      req('Toggle favourite', 'POST', '/api/users/:userId/favourites/:propertyId/toggle', { auth: 'buyerToken' }),
      req('List favourites', 'GET', '/api/users/:userId/favourites', { auth: 'buyerToken' }),
      req('List favourite ids', 'GET', '/api/users/:userId/favourites/ids', { auth: 'buyerToken' }),
      req('Create draft property', 'POST', '/api/properties/drafts', {
        auth: 'sellerToken',
        body: { categorySlug: 'apartments', titleEn: 'New Draft Property', city: 'Hyderabad', price: 4500000 },
      }),
      req('Update property', 'PATCH', '/api/properties/:id', { auth: 'sellerToken', body: { titleEn: 'Updated Title' } }),
      req('Submit property for review', 'POST', '/api/properties/:id/submit', { auth: 'sellerToken' }),
      req('Seller properties', 'GET', '/api/sellers/:sellerId/properties', { auth: 'sellerToken' }),
      req('My properties (seller)', 'GET', '/api/me/properties', { auth: 'sellerToken' }),
      req('Mediator properties', 'GET', '/api/mediator/properties', { auth: 'mediatorToken' }),
      req('Employee properties', 'GET', '/api/employee/properties', { auth: 'employeeToken' }),
      req('Admin properties', 'GET', '/api/admin/properties', { auth: 'adminToken' }),
      req('Moderate property (approve/reject/requestChanges)', 'POST', '/api/admin/properties/:id/moderate', {
        auth: 'adminToken',
        body: { action: 'approve', note: 'Looks good' },
      }),
      req('Approve property', 'PATCH', '/api/admin/properties/:id/approve', { auth: 'adminToken' }),
      req('Reject property', 'PATCH', '/api/admin/properties/:id/reject', { auth: 'adminToken', body: { note: 'Not enough info' } }),
      req('Request changes on property', 'PATCH', '/api/admin/properties/:id/request-changes', {
        auth: 'adminToken',
        body: { note: 'Please add more images' },
      }),
      req('Assign employee to property', 'PATCH', '/api/admin/properties/:id/assign-employee', {
        auth: 'adminToken',
        body: { assignedEmployeeId: '{{employeeId}}' },
      }),
      req('Assign mediator to property', 'PATCH', '/api/admin/properties/:id/assign-mediator', {
        auth: 'adminToken',
        body: { assignedMediatorId: '{{mediatorId}}' },
      }),
      req('Feature property', 'PATCH', '/api/admin/properties/:id/feature', { auth: 'adminToken', body: { featured: true } }),
      req('Verify property', 'PATCH', '/api/admin/properties/:id/verify', { auth: 'adminToken', body: { verified: true } }),
      req('Mark property sold', 'PATCH', '/api/admin/properties/:id/mark-sold', { auth: 'adminToken' }),
      req('Delete property', 'DELETE', '/api/properties/:id', { auth: 'sellerToken' }),
      req('Assign property (generic)', 'PATCH', '/api/properties/:id/assign', {
        auth: 'adminToken',
        body: { assignedEmployeeId: '{{employeeId}}', assignedMediatorId: '{{mediatorId}}' },
      }),
    ],
  },
  {
    name: 'Employee Property Moderation',
    item: [
      req('List assigned properties', 'GET', '/api/employee/property-moderation', { auth: 'employeeToken' }),
      req('Get property moderation detail', 'GET', '/api/employee/property-moderation/:id', { auth: 'employeeToken' }),
      req('Start review', 'POST', '/api/employee/property-moderation/:id/start', { auth: 'employeeToken' }),
      req('Add note', 'POST', '/api/employee/property-moderation/:id/add-note', { auth: 'employeeToken', body: { note: 'Checked documents' } }),
      req('Request changes', 'POST', '/api/employee/property-moderation/:id/request-changes', {
        auth: 'employeeToken',
        body: { reason: 'Missing layout plan', fields: ['plotDetails'], slots: ['layoutPlan'] },
      }),
      req('Recommend approval', 'POST', '/api/employee/property-moderation/:id/recommend-approval', { auth: 'employeeToken' }),
      req('Recommend rejection', 'POST', '/api/employee/property-moderation/:id/recommend-rejection', { auth: 'employeeToken' }),
      req('Complete moderation', 'POST', '/api/employee/property-moderation/:id/complete', { auth: 'employeeToken' }),
    ],
  },
  {
    name: 'Employee User Verification',
    item: [
      req('List assigned users', 'GET', '/api/employee/user-verification', { auth: 'employeeToken' }),
      req('Get user verification detail', 'GET', '/api/employee/user-verification/:userId', { auth: 'employeeToken' }),
      req('Start review', 'POST', '/api/employee/user-verification/:userId/start-review', { auth: 'employeeToken' }),
      req('Correction request', 'POST', '/api/employee/user-verification/:userId/correction-request', {
        auth: 'employeeToken',
        body: { reason: 'ID proof unclear', fields: ['idProof'] },
      }),
      req('Recommend approval', 'POST', '/api/employee/user-verification/:userId/recommend-approval', { auth: 'employeeToken' }),
      req('Recommend rejection', 'POST', '/api/employee/user-verification/:userId/recommend-rejection', { auth: 'employeeToken' }),
      req('Complete verification', 'POST', '/api/employee/user-verification/:userId/complete', { auth: 'employeeToken' }),
    ],
  },
  {
    name: 'Enquiries & Call Notes',
    item: [
      req('Create enquiry (public)', 'POST', '/api/enquiries', {
        body: { propertyId: '{{propertyId}}', buyerName: 'Interested Buyer', buyerPhone: '9123450000', message: 'Please call me', channel: 'whatsapp' },
      }),
      req('Seller enquiries', 'GET', '/api/sellers/:sellerId/enquiries', { auth: 'sellerToken' }),
      req('Admin enquiries', 'GET', '/api/admin/enquiries', { auth: 'adminToken' }),
      req('Employee enquiries', 'GET', '/api/employee/enquiries', { auth: 'employeeToken' }),
      req('Buyer enquiries by phone', 'GET', '/api/buyers/enquiries', { query: 'phone=9123450000' }),
      req('Get enquiry', 'GET', '/api/enquiries/:id', { auth: 'sellerToken' }),
      req('Update enquiry status', 'PATCH', '/api/enquiries/:id/status', { auth: 'sellerToken', body: { status: 'contacted' } }),
      req('Update enquiry priority', 'PATCH', '/api/enquiries/:id/priority', { auth: 'employeeToken', body: { priority: 'high' } }),
      req('Update next follow-up', 'PATCH', '/api/enquiries/:id/next-follow-up', { auth: 'sellerToken', body: { nextFollowUpAt: '2026-08-10T10:00:00.000Z' } }),
      req('Complete enquiry', 'PATCH', '/api/enquiries/:id/complete', { auth: 'sellerToken' }),
      req('Assign employee to enquiry', 'PATCH', '/api/admin/enquiries/:id/assign-employee', { auth: 'adminToken', body: { employeeId: '{{employeeId}}' } }),
      req('Assign mediator to enquiry', 'PATCH', '/api/admin/enquiries/:id/assign-mediator', { auth: 'adminToken', body: { mediatorId: '{{mediatorId}}' } }),
      req('List call notes', 'GET', '/api/enquiries/:id/call-notes', { auth: 'employeeToken' }),
      req('Add call note', 'POST', '/api/enquiries/:id/call-notes', {
        auth: 'employeeToken',
        body: { callDateTime: '2026-08-02T10:00:00.000Z', direction: 'outgoing', result: 'Interested', summary: 'Discussed pricing', interestLevel: 'high', nextAction: 'Schedule visit' },
      }),
      req('Update call note', 'PATCH', '/api/call-notes/:id', { auth: 'employeeToken', body: { summary: 'Updated summary' } }),
      req('Delete call note', 'DELETE', '/api/call-notes/:id', { auth: 'employeeToken' }),
    ],
  },
  {
    name: 'Visits',
    item: [
      req('Schedule visit', 'POST', '/api/visits', {
        auth: 'buyerToken',
        body: { propertyId: '{{propertyId}}', buyerId: '{{buyerId}}', buyerName: 'Anita Reddy', scheduledFor: '2026-08-15T10:00:00.000Z', meetingLocation: 'Property site' },
      }),
      req('My visits (buyer)', 'GET', '/api/me/visits', { auth: 'buyerToken' }),
      req('Seller visits', 'GET', '/api/seller/visits', { auth: 'sellerToken' }),
      req('Mediator visits', 'GET', '/api/mediator/visits', { auth: 'mediatorToken' }),
      req('Employee visits', 'GET', '/api/employee/visits', { auth: 'employeeToken' }),
      req('Admin visits', 'GET', '/api/admin/visits', { auth: 'adminToken' }),
      req('Confirm visit', 'POST', '/api/visits/:id/confirm', { auth: 'employeeToken' }),
      req('Reschedule visit', 'PATCH', '/api/visits/:id/reschedule', { auth: 'buyerToken', body: { scheduledFor: '2026-08-16T10:00:00.000Z', note: 'Buyer requested change' } }),
      req('Complete visit', 'POST', '/api/visits/:id/complete', { auth: 'employeeToken' }),
      req('Cancel visit', 'POST', '/api/visits/:id/cancel', { auth: 'buyerToken', body: { note: 'Not available' } }),
      req('Mark visit no-show', 'POST', '/api/visits/:id/no-show', { auth: 'employeeToken', body: { note: 'Buyer did not show up' } }),
      req('Add visit note', 'POST', '/api/visits/:id/add-note', { auth: 'employeeToken', body: { note: 'Called buyer to confirm' } }),
      req('Set visit outcome', 'POST', '/api/visits/:id/outcome', { auth: 'employeeToken', body: { outcome: 'interested' } }),
      req('Assign visit', 'PATCH', '/api/admin/visits/:id/assign', {
        auth: 'adminToken',
        body: { assignedMediatorId: '{{mediatorId}}', assignedEmployeeId: '{{employeeId}}', assignmentNote: 'Please handle', assignmentDueAt: '2026-08-14T00:00:00.000Z' },
      }),
    ],
  },
  {
    name: 'Follow Ups',
    item: [
      req('Create follow-up', 'POST', '/api/follow-ups', {
        auth: 'adminToken',
        body: { recordType: 'enquiry', recordId: '{{enquiryId}}', assignedEmployeeId: '{{employeeId}}', dueDate: '2026-08-10', dueTime: '11:00', priority: 'high', reason: 'Call buyer', nextAction: 'Call buyer' },
      }),
      req('Employee follow-ups', 'GET', '/api/employee/follow-ups', { auth: 'employeeToken' }),
      req('Admin follow-ups', 'GET', '/api/admin/follow-ups', { auth: 'adminToken' }),
      req('Start follow-up', 'POST', '/api/follow-ups/:id/start', { auth: 'employeeToken' }),
      req('Reschedule follow-up', 'PATCH', '/api/follow-ups/:id/reschedule', { auth: 'employeeToken', body: { dueDate: '2026-08-12', dueTime: '15:00', note: 'Buyer asked to reschedule' } }),
      req('Complete follow-up', 'POST', '/api/follow-ups/:id/complete', { auth: 'employeeToken', body: { completionNote: 'Buyer confirmed visit' } }),
      req('Cancel follow-up', 'POST', '/api/follow-ups/:id/cancel', { auth: 'employeeToken', body: { note: 'No longer needed' } }),
      req('Add follow-up note', 'POST', '/api/follow-ups/:id/add-note', { auth: 'employeeToken', body: { note: 'Left voicemail' } }),
      req('Admin assign follow-up', 'PATCH', '/api/admin/follow-ups/:id/assign', { auth: 'adminToken', body: { assignedEmployeeId: '{{employeeId}}', assignmentNote: 'Reassigning' } }),
    ],
  },
  {
    name: 'Favourites & Saved Searches',
    item: [
      req('List my favourites', 'GET', '/api/favourites', { auth: 'buyerToken' }),
      req('Add favourite', 'POST', '/api/favourites', { auth: 'buyerToken', body: { propertyId: '{{propertyId}}' } }),
      req('Remove favourite', 'DELETE', '/api/favourites/:propertyId', { auth: 'buyerToken' }),
      req('List saved searches', 'GET', '/api/saved-searches', { auth: 'buyerToken' }),
      req('Create saved search', 'POST', '/api/saved-searches', {
        auth: 'buyerToken',
        body: { name: 'Hyderabad Apartments under 80L', city: 'Hyderabad', categorySlug: 'apartments', maxPrice: 8000000 },
      }),
      req('Delete saved search', 'DELETE', '/api/saved-searches/:id', { auth: 'buyerToken' }),
    ],
  },
  {
    name: 'Notifications',
    item: [
      req('My notifications', 'GET', '/api/notifications/me', { auth: 'adminToken' }),
      req('Mark notification read', 'PATCH', '/api/notifications/:id/read', { auth: 'adminToken' }),
      req('Mark all notifications read', 'PATCH', '/api/notifications/read-all', { auth: 'adminToken' }),
    ],
  },
  {
    name: 'Internal Notes',
    item: [
      req('List internal notes', 'GET', '/api/internal-notes', { auth: 'employeeToken', query: 'recordType=enquiry&recordId={{enquiryId}}' }),
      req('Add internal note', 'POST', '/api/internal-notes', {
        auth: 'employeeToken',
        body: { recordType: 'enquiry', recordId: '{{enquiryId}}', text: 'Buyer seems serious, prioritize.' },
      }),
      req('Update internal note', 'PATCH', '/api/internal-notes/:id', { auth: 'employeeToken', body: { text: 'Updated note text' } }),
      req('Delete internal note', 'DELETE', '/api/internal-notes/:id', { auth: 'employeeToken' }),
    ],
  },
  {
    name: 'Audit Logs',
    item: [req('List audit logs (admin only)', 'GET', '/api/admin/audit-logs', { auth: 'adminToken' })],
  },
  {
    name: 'CMS & Settings',
    item: [
      req('Get CMS content', 'GET', '/api/cms'),
      req('Update CMS content', 'PATCH', '/api/admin/cms', { auth: 'adminToken', body: { contactPhone: '+91 9000000099' } }),
      req('Get app settings', 'GET', '/api/admin/settings', { auth: 'adminToken' }),
      req('Update app settings', 'PATCH', '/api/admin/settings', { auth: 'adminToken', body: { autoApproveProperties: true } }),
    ],
  },
  {
    name: 'Uploads',
    item: [
      req('Upload profile image', 'POST', '/api/uploads/profile', { auth: 'buyerToken' }),
      req('Upload identity proof', 'POST', '/api/uploads/identity-proof', { auth: 'sellerToken' }),
      req('Upload property image', 'POST', '/api/uploads/property-image', { auth: 'sellerToken' }),
      req('Upload property document', 'POST', '/api/uploads/property-document', { auth: 'sellerToken' }),
      req('Upload CMS image', 'POST', '/api/uploads/cms-image', { auth: 'adminToken' }),
      req('Delete uploaded file', 'DELETE', '/api/uploads/:id', { auth: 'adminToken' }),
    ],
  },
  {
    name: 'Reports (Excel)',
    item: [
      req('Users report', 'GET', '/api/admin/reports/users.xlsx', { auth: 'adminToken' }),
      req('Properties report', 'GET', '/api/admin/reports/properties.xlsx', { auth: 'adminToken' }),
      req('Enquiries report', 'GET', '/api/admin/reports/enquiries.xlsx', { auth: 'adminToken' }),
      req('Visits report', 'GET', '/api/admin/reports/visits.xlsx', { auth: 'adminToken' }),
      req('Follow-ups report', 'GET', '/api/admin/reports/follow-ups.xlsx', { auth: 'adminToken' }),
      req('Commissions report', 'GET', '/api/admin/reports/commissions.xlsx', { auth: 'adminToken' }),
    ],
  },
  {
    name: 'Dashboards',
    item: [
      req('Admin dashboard', 'GET', '/api/admin/dashboard', { auth: 'adminToken' }),
      req('Employee dashboard', 'GET', '/api/employee/dashboard', { auth: 'employeeToken' }),
      req('Buyer dashboard', 'GET', '/api/buyer/dashboard', { auth: 'buyerToken' }),
      req('Seller dashboard', 'GET', '/api/seller/dashboard', { auth: 'sellerToken' }),
      req('Mediator dashboard', 'GET', '/api/mediator/dashboard', { auth: 'mediatorToken' }),
    ],
  },
];

const collection = {
  info: {
    name: 'OMKARESWAR REALTORS API',
    description: 'Complete API collection for the OMKARESWAR REALTORS real-estate platform backend.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:5000' },
    { key: 'adminToken', value: '' },
    { key: 'employeeToken', value: '' },
    { key: 'buyerToken', value: '' },
    { key: 'sellerToken', value: '' },
    { key: 'mediatorToken', value: '' },
    { key: 'refreshToken', value: '' },
    { key: 'propertyId', value: '' },
    { key: 'enquiryId', value: '' },
    { key: 'employeeId', value: '' },
    { key: 'mediatorId', value: '' },
    { key: 'buyerId', value: '' },
  ],
  item: folders,
};

fs.writeFileSync('docs/OMKARESWAR-REALTORS.postman_collection.json', JSON.stringify(collection, null, 2));
console.log('Postman collection written to docs/OMKARESWAR-REALTORS.postman_collection.json');
