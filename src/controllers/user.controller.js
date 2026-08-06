import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendList } from '../utils/response.js';
import * as userService from '../services/user.service.js';

export const listUsers = asyncHandler(async (req, res) => {
  const { items, total, page, pageSize } = await userService.listUsers(req.user, req.query);
  sendList(res, { items, total, page, pageSize });
});

export const getUser = asyncHandler(async (req, res) => {
  const data = await userService.getUser(req.params.id);
  sendSuccess(res, { message: 'User fetched', data });
});

export const updateUser = asyncHandler(async (req, res) => {
  const data = await userService.updateUser(req.params.id, req.body, req.user);
  sendSuccess(res, { message: 'User updated', data });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const data = await userService.updateStatus(req.params.id, req.body.status, req.user);
  sendSuccess(res, { message: 'Status updated', data });
});

export const createEmployee = asyncHandler(async (req, res) => {
  const data = await userService.createEmployee(req.body, req.user);
  sendSuccess(res, { message: 'Employee created', data, statusCode: 201 });
});

export const updateEmployeePermissions = asyncHandler(async (req, res) => {
  const data = await userService.updateEmployeePermissions(req.params.id, req.body.permissions, req.user);
  sendSuccess(res, { message: 'Permissions updated', data });
});

export const updateEmployeeStatus = asyncHandler(async (req, res) => {
  const data = await userService.updateEmployeeStatus(req.params.id, req.body.status, req.user);
  sendSuccess(res, { message: 'Employee status updated', data });
});

export const assignMediator = asyncHandler(async (req, res) => {
  const data = await userService.assignMediator(req.params.id, req.body.mediatorId, req.user);
  sendSuccess(res, { message: 'Mediator assigned', data });
});
