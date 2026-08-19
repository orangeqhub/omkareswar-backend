import { Router } from 'express';
import * as controller from '../controllers/dashboard.controller.js';
import auth from '../middleware/auth.js';
import { requireRole, requirePermission } from '../middleware/permission.js';
import { ROLES } from '../constants/roles.js';
import { PERMISSIONS } from '../constants/permissions.js';

export const adminRouter = Router();
adminRouter.get('/', auth, requireRole(ROLES.ADMIN), controller.admin);
adminRouter.get('/performance', auth, requireRole(ROLES.ADMIN), controller.performance);

export const employeeRouter = Router();
employeeRouter.get(
  '/',
  auth,
  requireRole(ROLES.EMPLOYEE),
  requirePermission(PERMISSIONS.EMPLOYEE_DASHBOARD_VIEW),
  controller.employee
);

export const buyerRouter = Router();
buyerRouter.get('/', auth, requireRole(ROLES.BUYER), controller.buyer);

export const sellerRouter = Router();
sellerRouter.get('/', auth, requireRole(ROLES.SELLER), controller.seller);

export const mediatorRouter = Router();
mediatorRouter.get('/', auth, requireRole(ROLES.MEDIATOR), controller.mediator);
