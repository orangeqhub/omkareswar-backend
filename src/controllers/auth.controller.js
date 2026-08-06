import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { toSafeUser } from '../utils/sanitize.js';
import * as authService from '../services/auth.service.js';

export const requestOtp = asyncHandler(async (req, res) => {
  const data = await authService.requestPublicOtp(req.body.mobile);
  sendSuccess(res, { message: 'OTP sent successfully', data });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const data = await authService.loginPublicWithOtp(req.body.mobile, req.body.otp);
  sendSuccess(res, { message: 'Login successful', data });
});

export const adminLogin = asyncHandler(async (req, res) => {
  const data = await authService.loginAdmin(req.body.loginId, req.body.password);
  sendSuccess(res, { message: 'Login successful', data });
});

export const employeeLogin = asyncHandler(async (req, res) => {
  const data = await authService.loginEmployee(req.body.employeeId, req.body.password);
  sendSuccess(res, { message: 'Login successful', data });
});

export const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, { message: 'Session fetched', data: { user: toSafeUser(req.user) } });
});

export const logout = asyncHandler(async (req, res) => {
  // Stateless JWT: logout is a client-side action (discard token). Nothing to invalidate server-side.
  sendSuccess(res, { message: 'Logged out successfully', data: null });
});

export const refresh = asyncHandler(async (req, res) => {
  const data = await authService.refreshAccessToken(req.body.refreshToken);
  sendSuccess(res, { message: 'Token refreshed', data });
});

export const resetEmployeePassword = asyncHandler(async (req, res) => {
  const data = await authService.resetEmployeePassword(req.body.employeeId, req.body.newPassword);
  sendSuccess(res, { message: 'Password updated successfully', data });
});

export const resetAdminPassword = asyncHandler(async (req, res) => {
  const data = await authService.resetAdminPassword(req.body.adminId, req.body.newPassword);
  sendSuccess(res, { message: 'Admin password updated successfully', data });
});
