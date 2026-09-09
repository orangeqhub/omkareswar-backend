import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendList } from '../utils/response.js';
import * as landingLeadService from '../services/landingLead.service.js';

export const create = asyncHandler(async (req, res) => {
  const lead = await landingLeadService.create(req.body);
  sendSuccess(res, { message: 'Lead submitted', data: lead, statusCode: 201 });
});

export const adminList = asyncHandler(async (req, res) => {
  const { items, total, page, pageSize } = await landingLeadService.adminList(req.query);
  sendList(res, { items, total, page, pageSize, message: 'Leads fetched' });
});