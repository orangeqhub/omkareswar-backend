import { Router } from 'express';
import * as visitController from '../controllers/visit.controller.js';
import auth from '../middleware/auth.js';
import { requireRole, requirePermission } from '../middleware/permission.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';
import { PERMISSIONS } from '../constants/permissions.js';
import {
  idParamValidator,
  createVisitValidator,
  rescheduleValidator,
  noteBodyValidator,
  outcomeValidator,
  assignValidator,
} from '../validators/visit.validator.js';

// ---- /api/visits ----
const router = Router();
router.post('/', auth, createVisitValidator, validate, visitController.create);
router.post(
  '/:id/confirm',
  auth,
  requireRole(ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.MEDIATOR, ROLES.SELLER),
  requirePermission(PERMISSIONS.VISIT_UPDATE),
  idParamValidator,
  validate,
  visitController.confirm
);
router.patch('/:id/reschedule', auth, rescheduleValidator, validate, visitController.reschedule);
router.post('/:id/complete', auth, idParamValidator, validate, visitController.complete);
router.post('/:id/cancel', auth, noteBodyValidator, validate, visitController.cancel);
router.post('/:id/no-show', auth, noteBodyValidator, validate, visitController.noShow);
router.post('/:id/add-note', auth, noteBodyValidator, validate, visitController.addNote);
router.post('/:id/outcome', auth, outcomeValidator, validate, visitController.outcome);
export default router;

// ---- /api/me/visits ----
export const meRouter = Router();
meRouter.get('/visits', auth, requireRole(ROLES.BUYER), visitController.myVisits);

// ---- /api/seller/visits ----
export const sellerRouter = Router();
sellerRouter.get('/visits', auth, requireRole(ROLES.SELLER), visitController.sellerVisits);

// ---- /api/mediator/visits ----
export const mediatorRouter = Router();
mediatorRouter.get('/visits', auth, requireRole(ROLES.MEDIATOR), visitController.mediatorVisits);

// ---- /api/employee/visits ----
export const employeeRouter = Router();
employeeRouter.get(
  '/visits',
  auth,
  requireRole(ROLES.EMPLOYEE),
  requirePermission(PERMISSIONS.VISIT_VIEW),
  visitController.employeeVisits
);

// ---- /api/admin/visits ----
export const adminRouter = Router();
adminRouter.get('/', auth, requireRole(ROLES.ADMIN), visitController.adminVisits);
adminRouter.patch('/:id/assign', auth, requireRole(ROLES.ADMIN), assignValidator, validate, visitController.assign);
adminRouter.post('/:id/approve', auth, requireRole(ROLES.ADMIN), idParamValidator, validate, visitController.approve);
adminRouter.post('/:id/reject', auth, requireRole(ROLES.ADMIN), idParamValidator, validate, visitController.reject);
