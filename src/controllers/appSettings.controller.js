import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as settingsService from '../services/appSettings.service.js';

export const getSettings = asyncHandler(async (req, res) => {
  const data = await settingsService.getSettings();
  sendSuccess(res, { message: 'Settings fetched', data });
});

export const getPublicSettings = asyncHandler(async (req, res) => {
  const data = await settingsService.getSettings();
  sendSuccess(res, {
    message: 'Public settings fetched',
    data: {
      customLocations: data.customLocations || [],
      maxImageSizeMb: data.maxImageSizeMb || 5,
      propertyFields: data.propertyFields || [],
      fieldConfig: data.fieldConfig || {},
    },
  });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const data = await settingsService.updateSettings(req.body, req.user);
  sendSuccess(res, { message: 'Settings updated', data });
});
