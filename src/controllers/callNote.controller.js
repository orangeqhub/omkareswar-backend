import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as callNoteService from '../services/callNote.service.js';

export const list = asyncHandler(async (req, res) => {
  const data = await callNoteService.list(req.params.id, req.user);
  sendSuccess(res, { message: 'Call notes fetched', data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await callNoteService.create(req.params.id, req.body, req.user);
  sendSuccess(res, { message: 'Call note added', data, statusCode: 201 });
});

export const update = asyncHandler(async (req, res) => {
  const data = await callNoteService.update(req.params.id, req.body, req.user);
  sendSuccess(res, { message: 'Call note updated', data });
});

export const remove = asyncHandler(async (req, res) => {
  await callNoteService.remove(req.params.id, req.user);
  sendSuccess(res, { message: 'Call note deleted', data: null });
});
