import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as mediaRuleService from '../services/mediaRule.service.js';

export const listAll = asyncHandler(async (req, res) => {
  const data = await mediaRuleService.listAll();
  sendSuccess(res, { message: 'Media rules fetched', data });
});

export const getOne = asyncHandler(async (req, res) => {
  const data = await mediaRuleService.getOne(req.params.ruleKey);
  sendSuccess(res, { message: 'Media rule fetched', data });
});

export const update = asyncHandler(async (req, res) => {
  const data = await mediaRuleService.updateRule(req.params.ruleKey, req.body, req.user);
  sendSuccess(res, { message: 'Media rule updated', data });
});

export const restoreDefaults = asyncHandler(async (req, res) => {
  const data = await mediaRuleService.restoreDefaults(req.params.ruleKey, req.user);
  sendSuccess(res, { message: 'Defaults restored', data });
});

export const addCommonSlot = asyncHandler(async (req, res) => {
  const data = await mediaRuleService.addCommonSlot(req.params.ruleKey, req.body, req.user);
  sendSuccess(res, { message: 'Slot added', data, statusCode: 201 });
});

export const updateCommonSlot = asyncHandler(async (req, res) => {
  const data = await mediaRuleService.updateCommonSlot(req.params.ruleKey, req.params.slotId, req.body, req.user);
  sendSuccess(res, { message: 'Slot updated', data });
});

export const deleteCommonSlot = asyncHandler(async (req, res) => {
  await mediaRuleService.deleteCommonSlot(req.params.ruleKey, req.params.slotId, req.user);
  sendSuccess(res, { message: 'Slot deleted', data: null });
});

export const addExtraSpace = asyncHandler(async (req, res) => {
  const data = await mediaRuleService.addExtraSpace(req.params.ruleKey, req.body, req.user);
  sendSuccess(res, { message: 'Extra space added', data, statusCode: 201 });
});

export const deleteExtraSpace = asyncHandler(async (req, res) => {
  await mediaRuleService.deleteExtraSpace(req.params.ruleKey, req.params.key, req.user);
  sendSuccess(res, { message: 'Extra space deleted', data: null });
});
