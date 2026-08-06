import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as service from '../services/savedSearch.service.js';

export const list = asyncHandler(async (req, res) => {
  const data = await service.list(req.user.id);
  sendSuccess(res, { message: 'Saved searches fetched', data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await service.create(req.user.id, req.body);
  sendSuccess(res, { message: 'Saved search created', data, statusCode: 201 });
});

export const remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id, req.user.id);
  sendSuccess(res, { message: 'Saved search deleted', data: null });
});
