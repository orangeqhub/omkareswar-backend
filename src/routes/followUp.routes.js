import { Router } from 'express';
import * as controller from '../controllers/followUp.controller.js';
import auth from '../middleware/auth.js';
import { requireRole, requirePermission } from '../middleware/permission.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';
import { PERMISSIONS } from '../constants/permissions.js';
import { idParamValidator, createValidator, rescheduleValidator, assignValidator } from '../validators/followUp.validator.js';

// ---- /api/follow-ups ----
const router = Router();
router.post(
  '/',
  auth,
  requireRole(ROLES.ADMIN, ROLES.EMPLOYEE),
  requirePermission(PERMISSIONS.FOLLOWUP_MANAGE),
  createValidator,
  validate,
  controller.create
);
router.post('/:id/start', auth, idParamValidator, validate, controller.start);
router.patch('/:id/reschedule', auth, rescheduleValidator, validate, controller.reschedule);
router.post('/:id/complete', auth, idParamValidator, validate, controller.complete);
router.post('/:id/cancel', auth, idParamValidator, validate, controller.cancel);
router.post('/:id/add-note', auth, idParamValidator, validate, controller.addNote);
export default router;

// ---- /api/employee/follow-ups ----
export const employeeRouter = Router();
employeeRouter.get(
  '/follow-ups',
  auth,
  requireRole(ROLES.EMPLOYEE),
  requirePermission(PERMISSIONS.FOLLOWUP_VIEW),
  controller.employeeList
);

// ---- /api/admin/follow-ups ----
export const adminRouter = Router();
adminRouter.get('/', auth, requireRole(ROLES.ADMIN), controller.adminList);
adminRouter.patch('/:id/assign', auth, requireRole(ROLES.ADMIN), assignValidator, validate, controller.adminAssign);
