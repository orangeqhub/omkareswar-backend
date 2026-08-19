import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import auth from '../middleware/auth.js';
import { requireRole } from '../middleware/permission.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';
import {
  idParamValidator,
  updateStatusValidator,
  createEmployeeValidator,
  updatePermissionsValidator,
  updateEmployeeStatusValidator,
  assignMediatorValidator,
  assignEmployeeValidator,
  changePasswordValidator,
} from '../validators/user.validator.js';

const router = Router();

router.post(
  '/change-password',
  auth,
  changePasswordValidator,
  validate,
  userController.changeOwnPassword
);
router.get('/', auth, requireRole(ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.MEDIATOR), userController.listUsers);
router.get('/:id', auth, idParamValidator, validate, userController.getUser);
router.patch('/:id', auth, idParamValidator, validate, userController.updateUser);
router.patch(
  '/:id/status',
  auth,
  requireRole(ROLES.ADMIN),
  updateStatusValidator,
  validate,
  userController.updateStatus
);

export default router;

// Admin-only employee & assignment management, mounted at /api/admin
export const adminRouter = Router();
adminRouter.post(
  '/employees',
  auth,
  requireRole(ROLES.ADMIN),
  createEmployeeValidator,
  validate,
  userController.createEmployee
);
adminRouter.put(
  '/employees/:id/permissions',
  auth,
  requireRole(ROLES.ADMIN),
  updatePermissionsValidator,
  validate,
  userController.updateEmployeePermissions
);
adminRouter.patch(
  '/employees/:id/status',
  auth,
  requireRole(ROLES.ADMIN),
  updateEmployeeStatusValidator,
  validate,
  userController.updateEmployeeStatus
);
adminRouter.patch(
  '/users/:id/assign-mediator',
  auth,
  requireRole(ROLES.ADMIN),
  assignMediatorValidator,
  validate,
  userController.assignMediator
);
adminRouter.post(
  '/users',
  auth,
  requireRole(ROLES.ADMIN),
  userController.createUser
);
adminRouter.delete(
  '/users/:id',
  auth,
  requireRole(ROLES.ADMIN),
  idParamValidator,
  validate,
  userController.deleteUser
);

adminRouter.get(
  '/employees/:id/details',
  auth,
  requireRole(ROLES.ADMIN),
  idParamValidator,
  validate,
  userController.getEmployeeDetail
);

adminRouter.get(
  '/users/:id/details',
  auth,
  requireRole(ROLES.ADMIN),
  idParamValidator,
  validate,
  userController.getUserDetail
);

adminRouter.patch(
  '/users/:id/assign-employee',
  auth,
  requireRole(ROLES.ADMIN),
  assignEmployeeValidator,
  validate,
  userController.assignEmployee
);
