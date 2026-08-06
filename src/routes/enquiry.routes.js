import { Router } from 'express';
import * as enquiryController from '../controllers/enquiry.controller.js';
import * as callNoteController from '../controllers/callNote.controller.js';
import auth from '../middleware/auth.js';
import { requireRole, requirePermission } from '../middleware/permission.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';
import { PERMISSIONS } from '../constants/permissions.js';
import {
  idParamValidator,
  createEnquiryValidator,
  statusValidator,
  priorityValidator,
  nextFollowUpValidator,
  assignValidator,
} from '../validators/enquiry.validator.js';
import { createCallNoteValidator, idParamValidator as callNoteIdValidator } from '../validators/callNote.validator.js';

// ---- /api/enquiries ----
const router = Router();
router.post('/', createEnquiryValidator, validate, enquiryController.create);
router.get('/:id', auth, idParamValidator, validate, enquiryController.getOne);
router.get('/:id/call-notes', auth, idParamValidator, validate, callNoteController.list);
router.post(
  '/:id/call-notes',
  auth,
  requireRole(ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.MEDIATOR),
  requirePermission(PERMISSIONS.CALL_NOTES_MANAGE),
  createCallNoteValidator,
  validate,
  callNoteController.create
);
router.patch('/:id/status', auth, statusValidator, validate, enquiryController.updateStatus);
router.patch(
  '/:id/priority',
  auth,
  requireRole(ROLES.ADMIN, ROLES.EMPLOYEE),
  requirePermission(PERMISSIONS.ENQUIRY_UPDATE),
  priorityValidator,
  validate,
  enquiryController.updatePriority
);
router.patch('/:id/next-follow-up', auth, nextFollowUpValidator, validate, enquiryController.updateNextFollowUp);
router.patch('/:id/complete', auth, idParamValidator, validate, enquiryController.complete);
export default router;

// ---- /api/call-notes/:id ----
export const callNoteRouter = Router();
callNoteRouter.patch('/:id', auth, callNoteIdValidator, validate, callNoteController.update);
callNoteRouter.delete('/:id', auth, callNoteIdValidator, validate, callNoteController.remove);

// ---- /api/sellers/:sellerId/enquiries ----
export const sellerRouter = Router();
sellerRouter.get('/:sellerId/enquiries', auth, requireRole(ROLES.SELLER, ROLES.ADMIN, ROLES.EMPLOYEE), enquiryController.sellerEnquiries);

// ---- /api/buyers/enquiries ----
export const buyerRouter = Router();
buyerRouter.get('/enquiries', enquiryController.buyerEnquiries);

// ---- /api/employee/enquiries ----
export const employeeRouter = Router();
employeeRouter.get(
  '/enquiries',
  auth,
  requireRole(ROLES.EMPLOYEE),
  requirePermission(PERMISSIONS.ENQUIRY_VIEW),
  enquiryController.employeeEnquiries
);

// ---- /api/admin/enquiries ----
export const adminRouter = Router();
adminRouter.get('/', auth, requireRole(ROLES.ADMIN, ROLES.MEDIATOR), enquiryController.adminEnquiries);
adminRouter.patch(
  '/:id/assign-employee',
  auth,
  requireRole(ROLES.ADMIN),
  assignValidator,
  validate,
  enquiryController.assignEmployee
);
adminRouter.patch(
  '/:id/assign-mediator',
  auth,
  requireRole(ROLES.ADMIN),
  assignValidator,
  validate,
  enquiryController.assignMediator
);
