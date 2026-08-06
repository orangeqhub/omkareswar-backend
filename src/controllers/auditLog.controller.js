import asyncHandler from '../utils/asyncHandler.js';
import { sendList } from '../utils/response.js';
import { getPagination } from '../utils/pagination.js';
import { AuditLog } from '../models/index.js';

export const list = asyncHandler(async (req, res) => {
  const { page, pageSize, limit, offset } = getPagination(req.query, 50);
  const where = {};
  if (req.query.action) where.action = req.query.action;
  if (req.query.actorId) where.actorId = req.query.actorId;

  const { rows, count } = await AuditLog.findAndCountAll({ where, order: [['createdAt', 'DESC']], limit, offset });
  sendList(res, { items: rows, total: count, page, pageSize });
});
