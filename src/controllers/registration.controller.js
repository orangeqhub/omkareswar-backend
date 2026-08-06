import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendList } from '../utils/response.js';
import * as registrationService from '../services/registration.service.js';

export const requestOtp = asyncHandler(async (req, res) => {
  const data = await registrationService.requestRegistrationOtp(req.body.mobile);
  sendSuccess(res, { message: 'OTP sent successfully', data });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  await registrationService.verifyRegistrationOtp(req.body.mobile, req.body.otp);
  sendSuccess(res, { message: 'OTP verified successfully', data: { verified: true } });
});

export const register = asyncHandler(async (req, res) => {
  const user = await registrationService.register(req.body.role, req.body);
  sendSuccess(res, { message: 'Registration submitted successfully', data: user, statusCode: 201 });
});

export const getApplicationStatus = asyncHandler(async (req, res) => {
  const data = await registrationService.getApplicationStatus(req.query.mobile);
  sendSuccess(res, { message: 'Status fetched', data });
});

export const listPending = asyncHandler(async (req, res) => {
  const { items, total, page, pageSize } = await registrationService.listPending(req.user, req.query);
  sendList(res, { items, total, page, pageSize });
});

export const assignEmployee = asyncHandler(async (req, res) => {
  const data = await registrationService.assignEmployee(req.params.id, req.body.employeeId, req.user);
  sendSuccess(res, { message: 'Employee assigned', data });
});

export const approve = asyncHandler(async (req, res) => {
  const data = await registrationService.approve(req.params.id, req.user);
  sendSuccess(res, { message: 'Registration approved', data });
});

export const reject = asyncHandler(async (req, res) => {
  const data = await registrationService.reject(req.params.id, req.body.reason, req.user);
  sendSuccess(res, { message: 'Registration rejected', data });
});

export const requestCorrection = asyncHandler(async (req, res) => {
  const data = await registrationService.requestCorrection(req.params.id, req.body.reason, req.body.fields, req.user);
  sendSuccess(res, { message: 'Correction requested', data });
});
