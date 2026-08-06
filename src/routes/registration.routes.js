import { Router } from 'express';
import * as registrationController from '../controllers/registration.controller.js';
import auth from '../middleware/auth.js';
import { requireRole } from '../middleware/permission.js';
import { otpLimiter } from '../middleware/rateLimiters.js';
import validate from '../middleware/validate.js';
import {
  registerValidator,
  statusQueryValidator,
  assignEmployeeValidator,
  rejectValidator,
  correctionValidator,
  idParamValidator,
} from '../validators/registration.validator.js';
import { requestOtpValidator, verifyOtpValidator } from '../validators/auth.validator.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Public registration flow
router.post('/otp/request', otpLimiter, requestOtpValidator, validate, registrationController.requestOtp);
router.post('/otp/verify', otpLimiter, verifyOtpValidator, validate, registrationController.verifyOtp);
router.post('/', registerValidator, validate, registrationController.register);
router.get('/status', statusQueryValidator, validate, registrationController.getApplicationStatus);

export default router;

// Admin/employee registration management routes are mounted separately (see admin.registration.routes.js)
export const adminRouter = Router();
adminRouter.get('/', auth, requireRole(ROLES.ADMIN, ROLES.EMPLOYEE), registrationController.listPending);
adminRouter.patch(
  '/:id/assign',
  auth,
  requireRole(ROLES.ADMIN),
  assignEmployeeValidator,
  validate,
  registrationController.assignEmployee
);
adminRouter.patch('/:id/approve', auth, requireRole(ROLES.ADMIN), idParamValidator, validate, registrationController.approve);
adminRouter.patch('/:id/reject', auth, requireRole(ROLES.ADMIN), rejectValidator, validate, registrationController.reject);
adminRouter.patch(
  '/:id/request-correction',
  auth,
  requireRole(ROLES.ADMIN),
  correctionValidator,
  validate,
  registrationController.requestCorrection
);
