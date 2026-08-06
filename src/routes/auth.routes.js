import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import auth from '../middleware/auth.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimiters.js';
import validate from '../middleware/validate.js';
import {
  requestOtpValidator,
  verifyOtpValidator,
  adminLoginValidator,
  employeeLoginValidator,
  refreshTokenValidator,
  resetEmployeePasswordValidator,
  resetAdminPasswordValidator,
} from '../validators/auth.validator.js';

const router = Router();

router.post('/otp/request', otpLimiter, requestOtpValidator, validate, authController.requestOtp);
router.post('/otp/verify', authLimiter, verifyOtpValidator, validate, authController.verifyOtp);
router.post('/admin/login', authLimiter, adminLoginValidator, validate, authController.adminLogin);
router.post('/employee/login', authLimiter, employeeLoginValidator, validate, authController.employeeLogin);
router.post('/refresh', authLimiter, refreshTokenValidator, validate, authController.refresh);
router.post('/employee/reset-password', authLimiter, resetEmployeePasswordValidator, validate, authController.resetEmployeePassword);
router.post('/admin/reset-password', authLimiter, resetAdminPasswordValidator, validate, authController.resetAdminPassword);
router.get('/me', auth, authController.getMe);
router.post('/logout', auth, authController.logout);

export default router;
