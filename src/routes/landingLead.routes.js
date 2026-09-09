import { Router } from 'express';
import * as controller from '../controllers/landingLead.controller.js';
import auth from '../middleware/auth.js';
import { requireRole } from '../middleware/permission.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';
import { createLeadValidator, listLeadsValidator } from '../validators/landingLead.validator.js';

// Public: the landing page lead form. No auth, no OTP, no account creation.
export const publicRouter = Router();
publicRouter.post('/', createLeadValidator, validate, controller.create);

// Admin-only: view submitted landing-page leads.
export const adminRouter = Router();
adminRouter.use(auth);
adminRouter.use(requireRole(ROLES.ADMIN));
adminRouter.get('/', listLeadsValidator, validate, controller.adminList);