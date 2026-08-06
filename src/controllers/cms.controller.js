import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as cmsService from '../services/cms.service.js';

export const getCms = asyncHandler(async (req, res) => {
  const data = await cmsService.getCms();
  sendSuccess(res, { message: 'CMS content fetched', data });
});

export const updateCms = asyncHandler(async (req, res) => {
  const data = await cmsService.updateCms(req.body, req.user);
  sendSuccess(res, { message: 'CMS content updated', data });
});
