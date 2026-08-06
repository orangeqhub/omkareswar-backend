import { body } from 'express-validator';

export const requestOtpValidator = [
  body('mobile').trim().matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10 digit mobile number'),
];

export const verifyOtpValidator = [
  body('mobile').trim().matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10 digit mobile number'),
  body('otp').trim().isLength({ min: 4, max: 6 }).withMessage('Enter a valid OTP'),
];

export const adminLoginValidator = [
  body('loginId').trim().notEmpty().withMessage('Login ID is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const employeeLoginValidator = [
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const refreshTokenValidator = [
  body('refreshToken').trim().notEmpty().withMessage('Refresh token is required'),
];

export const resetEmployeePasswordValidator = [
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

export const resetAdminPasswordValidator = [
  body('adminId').trim().notEmpty().withMessage('Admin ID is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];
