import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as dashboardService from '../services/dashboard.service.js';

export const admin = asyncHandler(async (req, res) => {
  const data = await dashboardService.adminDashboard();
  sendSuccess(res, { message: 'Dashboard fetched', data });
});

export const employee = asyncHandler(async (req, res) => {
  const data = await dashboardService.employeeDashboard(req.user);
  sendSuccess(res, { message: 'Dashboard fetched', data });
});

export const buyer = asyncHandler(async (req, res) => {
  const data = await dashboardService.buyerDashboard(req.user.id);
  sendSuccess(res, { message: 'Dashboard fetched', data });
});

export const seller = asyncHandler(async (req, res) => {
  const data = await dashboardService.sellerDashboard(req.user.id);
  sendSuccess(res, { message: 'Dashboard fetched', data });
});

export const mediator = asyncHandler(async (req, res) => {
  const data = await dashboardService.mediatorDashboard(req.user.id);
  sendSuccess(res, { message: 'Dashboard fetched', data });
});
