import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendList } from '../utils/response.js';
import * as service from '../services/propertyModeration.service.js';

export const list = asyncHandler(async (req, res) => {
  const { items, total, page, pageSize } = await service.listAssigned(req.user, req.query);
  sendList(res, { items, total, page, pageSize });
});

export const getOne = asyncHandler(async (req, res) => {
  const data = await service.getOne(req.params.id);
  sendSuccess(res, { message: 'Property fetched', data });
});

export const start = asyncHandler(async (req, res) => {
  const data = await service.start(req.params.id, req.user);
  sendSuccess(res, { message: 'Review started', data });
});

export const addNote = asyncHandler(async (req, res) => {
  const data = await service.addNote(req.params.id, req.body.note, req.user);
  sendSuccess(res, { message: 'Note added', data });
});

export const requestChanges = asyncHandler(async (req, res) => {
  const data = await service.requestChanges(req.params.id, req.body, req.user);
  sendSuccess(res, { message: 'Changes requested', data });
});

export const recommendApproval = asyncHandler(async (req, res) => {
  const data = await service.recommendApproval(req.params.id, req.user);
  sendSuccess(res, { message: 'Approval recommended', data });
});

export const recommendRejection = asyncHandler(async (req, res) => {
  const data = await service.recommendRejection(req.params.id, req.user);
  sendSuccess(res, { message: 'Rejection recommended', data });
});

export const complete = asyncHandler(async (req, res) => {
  const data = await service.complete(req.params.id, req.user);
  sendSuccess(res, { message: 'Moderation completed', data });
});
