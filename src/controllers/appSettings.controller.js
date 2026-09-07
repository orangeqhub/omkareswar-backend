import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as settingsService from '../services/appSettings.service.js';

export const getSettings = asyncHandler(async (req, res) => {
  const data = await settingsService.getSettings();
  sendSuccess(res, { message: 'Settings fetched', data });
});

export const getPublicSettings = asyncHandler(async (req, res) => {
  const data = await settingsService.getSettings();
  const role = ['buyer', 'seller', 'employee', 'mediator'].includes(req.query.role) ? req.query.role : null;
  sendSuccess(res, {
    message: 'Public settings fetched',
    data: {
      customLocations: data.customLocations || [],
      maxImageSizeMb: data.maxImageSizeMb || 5,
      propertyFields: role ? (data.propertyFieldsByRole?.[role] || data.propertyFields || []) : (data.propertyFields || []),
      fieldConfig: role ? (data.fieldConfigByRole?.[role] || data.fieldConfig || {}) : (data.fieldConfig || {}),
      amenitiesByCategory: data.amenitiesByCategory || {},
      filterConfig: data.filterConfig || {},
    },
  });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const data = await settingsService.updateSettings(req.body, req.user);
  sendSuccess(res, { message: 'Settings updated', data });
});
