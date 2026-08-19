import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendList } from '../utils/response.js';
import * as visitService from '../services/visit.service.js';

export const create = asyncHandler(async (req, res) => {
  const data = await visitService.createVisit(req.body, req.user);
  sendSuccess(res, { message: 'Visit scheduled', data, statusCode: 201 });
});

export const myVisits = asyncHandler(async (req, res) => {
  const { items, total, page, pageSize } = await visitService.listForBuyer(req.user.id, req.query);
  sendList(res, { items, total, page, pageSize });
});

export const sellerVisits = asyncHandler(async (req, res) => {
  const { items, total, page, pageSize } = await visitService.listForSeller(req.user.id, req.query);
  sendList(res, { items, total, page, pageSize });
});

export const mediatorVisits = asyncHandler(async (req, res) => {
  const { items, total, page, pageSize } = await visitService.listForMediator(req.user.id, req.query);
  sendList(res, { items, total, page, pageSize });
});

export const employeeVisits = asyncHandler(async (req, res) => {
  const { items, total, page, pageSize } = await visitService.listForEmployee(req.user, req.query);
  sendList(res, { items, total, page, pageSize });
});

export const adminVisits = asyncHandler(async (req, res) => {
  const { items, total, page, pageSize } = await visitService.listForAdmin(req.query);
  sendList(res, { items, total, page, pageSize });
});

export const confirm = asyncHandler(async (req, res) => {
  const data = await visitService.confirm(req.params.id, req.user);
  sendSuccess(res, { message: 'Visit confirmed', data });
});

export const reschedule = asyncHandler(async (req, res) => {
  const data = await visitService.reschedule(req.params.id, req.body.scheduledFor, req.body.note, req.user);
  sendSuccess(res, { message: 'Visit rescheduled', data });
});

export const complete = asyncHandler(async (req, res) => {
  const data = await visitService.complete(req.params.id, req.user);
  sendSuccess(res, { message: 'Visit completed', data });
});

export const cancel = asyncHandler(async (req, res) => {
  const data = await visitService.cancel(req.params.id, req.user, req.body.note);
  sendSuccess(res, { message: 'Visit cancelled', data });
});

export const noShow = asyncHandler(async (req, res) => {
  const data = await visitService.noShow(req.params.id, req.user, req.body.note);
  sendSuccess(res, { message: 'Visit marked as no-show', data });
});

export const addNote = asyncHandler(async (req, res) => {
  const data = await visitService.addNote(req.params.id, req.body.note, req.user);
  sendSuccess(res, { message: 'Note added', data });
});

export const outcome = asyncHandler(async (req, res) => {
  const data = await visitService.setOutcome(req.params.id, req.body.outcome, req.user);
  sendSuccess(res, { message: 'Outcome recorded', data });
});

export const assign = asyncHandler(async (req, res) => {
  const data = await visitService.assign(req.params.id, req.body, req.user);
  sendSuccess(res, { message: 'Visit assigned', data });
});

export const approve = asyncHandler(async (req, res) => {
  const data = await visitService.approveVisit(req.params.id, req.user);
  sendSuccess(res, { message: 'Visit approved', data });
});

export const reject = asyncHandler(async (req, res) => {
  const data = await visitService.rejectVisit(req.params.id, req.user, req.body.note);
  sendSuccess(res, { message: 'Visit rejected', data });
});
