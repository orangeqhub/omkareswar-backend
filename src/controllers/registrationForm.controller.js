import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as registrationFormService from '../services/registrationForm.service.js';

export const getPublicForm = asyncHandler(async (req, res) => {
  const form = await registrationFormService.getPublicForm(req.params.formType);
  sendSuccess(res, { message: 'Registration form fetched', data: form });
});

export const listForms = asyncHandler(async (req, res) => {
  const forms = await registrationFormService.listForms();
  sendSuccess(res, { message: 'Registration forms fetched', data: forms });
});

export const getForm = asyncHandler(async (req, res) => {
  const form = await registrationFormService.getFormAdmin(req.params.formType);
  sendSuccess(res, { message: 'Registration form fetched', data: form });
});

export const updateFormMeta = asyncHandler(async (req, res) => {
  const form = await registrationFormService.updateFormMeta(req.params.formType, req.body, req.user);
  sendSuccess(res, { message: 'Registration form updated', data: form });
});

export const createField = asyncHandler(async (req, res) => {
  const field = await registrationFormService.createField(req.params.formType, req.body, req.user);
  sendSuccess(res, { message: 'Field created', data: field, statusCode: 201 });
});

export const updateField = asyncHandler(async (req, res) => {
  const field = await registrationFormService.updateField(req.params.formType, req.params.fieldId, req.body, req.user);
  sendSuccess(res, { message: 'Field updated', data: field });
});

export const deleteField = asyncHandler(async (req, res) => {
  await registrationFormService.deleteField(req.params.formType, req.params.fieldId, req.user);
  sendSuccess(res, { message: 'Field deleted', data: null });
});

export const reorderFields = asyncHandler(async (req, res) => {
  const fields = await registrationFormService.reorderFields(req.params.formType, req.body.order, req.user);
  sendSuccess(res, { message: 'Field order updated', data: fields });
});
