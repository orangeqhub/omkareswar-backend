import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendList } from '../utils/response.js';
import * as followUpService from '../services/followUp.service.js';

export const employeeList = asyncHandler(async (req, res) => {
  const { items, total, page, pageSize } = await followUpService.listForEmployee(req.user, req.query);
  sendList(res, { items, total, page, pageSize });
});

export const adminList = asyncHandler(async (req, res) => {
  const { items, total, page, pageSize } = await followUpService.listForAdmin(req.query);
  sendList(res, { items, total, page, pageSize });
});

export const create = asyncHandler(async (req, res) => {
  const data = await followUpService.create(req.body, req.user);
  sendSuccess(res, { message: 'Follow-up created', data, statusCode: 201 });
});

export const start = asyncHandler(async (req, res) => {
  const data = await followUpService.start(req.params.id, req.user);
  sendSuccess(res, { message: 'Follow-up started', data });
});

export const reschedule = asyncHandler(async (req, res) => {
  const data = await followUpService.reschedule(req.params.id, req.body, req.user);
  sendSuccess(res, { message: 'Follow-up rescheduled', data });
});

export const complete = asyncHandler(async (req, res) => {
  const data = await followUpService.complete(req.params.id, req.body.completionNote, req.user);
  sendSuccess(res, { message: 'Follow-up completed', data });
});

export const cancel = asyncHandler(async (req, res) => {
  const data = await followUpService.cancel(req.params.id, req.body.note, req.user);
  sendSuccess(res, { message: 'Follow-up cancelled', data });
});

export const addNote = asyncHandler(async (req, res) => {
  const data = await followUpService.addNote(req.params.id, req.body.note, req.user);
  sendSuccess(res, { message: 'Note added', data });
});

export const adminAssign = asyncHandler(async (req, res) => {
  const data = await followUpService.adminAssign(req.params.id, req.body, req.user);
  sendSuccess(res, { message: 'Follow-up assigned', data });
});
