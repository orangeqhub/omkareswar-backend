import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendList } from '../utils/response.js';
import { toSafeUser } from '../utils/sanitize.js';
import * as service from '../services/userVerification.service.js';

export const list = asyncHandler(async (req, res) => {
  const { items, total, page, pageSize } = await service.listAssigned(req.user, req.query);
  sendList(res, { items: items.map(toSafeUser), total, page, pageSize });
});

export const getOne = asyncHandler(async (req, res) => {
  const data = await service.getOne(req.params.userId);
  sendSuccess(res, { message: 'User fetched', data: toSafeUser(data) });
});

export const startReview = asyncHandler(async (req, res) => {
  const data = await service.startReview(req.params.userId, req.user);
  sendSuccess(res, { message: 'Review started', data: toSafeUser(data) });
});

export const correctionRequest = asyncHandler(async (req, res) => {
  const data = await service.correctionRequest(req.params.userId, req.body.reason, req.body.fields, req.user);
  sendSuccess(res, { message: 'Correction requested', data: toSafeUser(data) });
});

export const recommendApproval = asyncHandler(async (req, res) => {
  const data = await service.recommendApproval(req.params.userId, req.user);
  sendSuccess(res, { message: 'Approval recommended', data: toSafeUser(data) });
});

export const recommendRejection = asyncHandler(async (req, res) => {
  const data = await service.recommendRejection(req.params.userId, req.user);
  sendSuccess(res, { message: 'Rejection recommended', data: toSafeUser(data) });
});

export const complete = asyncHandler(async (req, res) => {
  const data = await service.complete(req.params.userId, req.user);
  sendSuccess(res, { message: 'Verification completed', data: toSafeUser(data) });
});
