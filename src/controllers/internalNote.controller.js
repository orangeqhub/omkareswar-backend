import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as service from '../services/internalNote.service.js';

export const list = asyncHandler(async (req, res) => {
  const data = await service.list(req.query.recordType, req.query.recordId);
  sendSuccess(res, { message: 'Notes fetched', data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await service.create(req.body, req.user);
  sendSuccess(res, { message: 'Note added', data, statusCode: 201 });
});

export const update = asyncHandler(async (req, res) => {
  const data = await service.update(req.params.id, req.body.text, req.user);
  sendSuccess(res, { message: 'Note updated', data });
});

export const remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id, req.user);
  sendSuccess(res, { message: 'Note deleted', data: null });
});
