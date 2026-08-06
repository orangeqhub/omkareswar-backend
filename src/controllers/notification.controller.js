import asyncHandler from '../utils/asyncHandler.js';
import { sendList, sendSuccess } from '../utils/response.js';
import { getPagination } from '../utils/pagination.js';
import * as notificationService from '../services/notification.service.js';

export const listMine = asyncHandler(async (req, res) => {
  const { page, pageSize, limit, offset } = getPagination(req.query, 30);
  const { items, total } = await notificationService.listForUser(req.user, { limit, offset });
  sendList(res, { items, total, page, pageSize });
});

export const markRead = asyncHandler(async (req, res) => {
  const data = await notificationService.markRead(req.params.id, req.user);
  sendSuccess(res, { message: 'Notification marked as read', data });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user);
  sendSuccess(res, { message: 'All notifications marked as read', data: null });
});
