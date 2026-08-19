import { Op } from 'sequelize';
import asyncHandler from '../utils/asyncHandler.js';
import { sendList } from '../utils/response.js';
import { getPagination } from '../utils/pagination.js';
import { AuditLog } from '../models/index.js';

export const list = asyncHandler(async (req, res) => {
  const { page, pageSize, limit, offset } = getPagination(req.query, 50);
  const where = {};
  if (req.query.action) where.action = req.query.action;
  if (req.query.actorId) where.actorId = req.query.actorId;

  if (req.query.startDate || req.query.endDate) {
    const start = req.query.startDate ? new Date(req.query.startDate) : new Date('1970-01-01');
    const end = req.query.endDate ? new Date(req.query.endDate) : new Date('2100-01-01');
    if (req.query.endDate && !req.query.endDate.includes('T')) {
      end.setHours(23, 59, 59, 999);
    }
    where.createdAt = { [Op.between]: [start, end] };
  }

  const { rows, count } = await AuditLog.findAndCountAll({ where, order: [['createdAt', 'DESC']], limit, offset });
  sendList(res, { items: rows, total: count, page, pageSize });
});
