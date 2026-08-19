import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendList } from '../utils/response.js';
import * as enquiryService from '../services/enquiry.service.js';

export const create = asyncHandler(async (req, res) => {
  const data = await enquiryService.createEnquiry(req.body);
  sendSuccess(res, { message: 'Enquiry submitted', data, statusCode: 201 });
});

export const sellerEnquiries = asyncHandler(async (req, res) => {
  const { items, total, page, pageSize } = await enquiryService.listSellerEnquiries(req.params.sellerId, req.query);
  sendList(res, { items, total, page, pageSize });
});

export const adminEnquiries = asyncHandler(async (req, res) => {
  const { items, total, page, pageSize } = await enquiryService.listAdminEnquiries(req.user, req.query);
  sendList(res, { items, total, page, pageSize });
});

export const employeeEnquiries = asyncHandler(async (req, res) => {
  const { items, total, page, pageSize } = await enquiryService.listEmployeeEnquiries(req.user, req.query);
  sendList(res, { items, total, page, pageSize });
});

export const buyerEnquiries = asyncHandler(async (req, res) => {
  const { items, total, page, pageSize } = await enquiryService.listBuyerEnquiries(req.query.phone, req.query);
  sendList(res, { items, total, page, pageSize });
});

export const getOne = asyncHandler(async (req, res) => {
  const data = await enquiryService.getOneForActor(req.params.id, req.user);
  sendSuccess(res, { message: 'Enquiry fetched', data });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const data = await enquiryService.updateStatus(req.params.id, req.body.status, req.user);
  sendSuccess(res, { message: 'Status updated', data });
});

export const updatePriority = asyncHandler(async (req, res) => {
  const data = await enquiryService.updatePriority(req.params.id, req.body.priority, req.user);
  sendSuccess(res, { message: 'Priority updated', data });
});

export const updateNextFollowUp = asyncHandler(async (req, res) => {
  const data = await enquiryService.updateNextFollowUp(req.params.id, req.body.nextFollowUpAt, req.user);
  sendSuccess(res, { message: 'Next follow-up updated', data });
});

export const complete = asyncHandler(async (req, res) => {
  const data = await enquiryService.complete(req.params.id, req.user);
  sendSuccess(res, { message: 'Enquiry completed', data });
});

export const employeeMarkStatus = asyncHandler(async (req, res) => {
  const data = await enquiryService.employeeMarkStatus(req.params.id, req.body.status, req.user);
  sendSuccess(res, { message: 'Status updated', data });
});

export const assignEmployee = asyncHandler(async (req, res) => {
  const data = await enquiryService.assignEmployee(req.params.id, req.body.employeeId, req.user);
  sendSuccess(res, { message: 'Employee assigned', data });
});

export const assignMediator = asyncHandler(async (req, res) => {
  const data = await enquiryService.assignMediator(req.params.id, req.body.assignedMediatorId, req.user);
  sendSuccess(res, { message: 'Mediator assigned', data });
});

export const approveStatus = asyncHandler(async (req, res) => {
  const data = await enquiryService.approveEnquiryStatus(req.params.id, req.user);
  sendSuccess(res, { message: 'Status approved', data });
});

export const rejectStatus = asyncHandler(async (req, res) => {
  const data = await enquiryService.rejectEnquiryStatus(req.params.id, req.user);
  sendSuccess(res, { message: 'Status rejected', data });
});
