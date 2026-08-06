import { Op } from 'sequelize';
import { sequelize, User, UserCorrectionHistory } from '../models/index.js';
import { PERMISSIONS } from '../constants/permissions.js';
import { ROLES } from '../constants/roles.js';
import AppError from '../utils/AppError.js';
import { getPagination } from '../utils/pagination.js';
import { createNotification } from './notification.service.js';
import { log as auditLog } from './auditLog.service.js';

const REGISTERABLE_ROLES = [ROLES.BUYER, ROLES.SELLER, ROLES.MEDIATOR];

export async function listAssigned(employee, query) {
  const { page, pageSize, limit, offset } = getPagination(query);
  const where = { role: { [Op.in]: REGISTERABLE_ROLES } };

  if (!(employee.permissions || []).includes(PERMISSIONS.VIEW_UNASSIGNED_RECORDS)) {
    where.assignedEmployeeId = employee.id;
  }
  if (query.verificationStatus) where.verificationStatus = query.verificationStatus;

  const { rows, count } = await User.findAndCountAll({
    where,
    include: [{ model: UserCorrectionHistory, as: 'correctionHistory' }],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });
  return { items: rows, total: count, page, pageSize };
}

async function getUserOrThrow(userId, transaction) {
  const user = await User.findOne({
    where: { id: userId, role: { [Op.in]: REGISTERABLE_ROLES } },
    include: [{ model: UserCorrectionHistory, as: 'correctionHistory' }],
    transaction,
  });
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  return user;
}

export async function getOne(userId) {
  return getUserOrThrow(userId);
}

async function addHistory(userId, actorId, action, extra, transaction) {
  return UserCorrectionHistory.create({ userId, actorId, action, ...extra }, { transaction });
}

export async function startReview(userId, actor) {
  const user = await getUserOrThrow(userId);
  return sequelize.transaction(async (t) => {
    user.verificationStatus = 'in_review';
    await user.save({ transaction: t });
    await addHistory(userId, actor.id, 'start_review', { statusAfter: user.verificationStatus }, t);
    await auditLog('userVerification.start', actor, { userId }, t);
    return getUserOrThrow(userId, t);
  });
}

export async function correctionRequest(userId, reason, fields, actor) {
  const user = await getUserOrThrow(userId);
  return sequelize.transaction(async (t) => {
    user.verificationStatus = 'correction_requested';
    user.status = 'correction_requested';
    user.correctionReason = reason;
    user.correctionFields = fields || [];
    await user.save({ transaction: t });

    await addHistory(userId, actor.id, 'correction_request', { reason, fields, statusAfter: user.verificationStatus }, t);

    await createNotification(
      {
        audienceUserId: user.id,
        type: 'userVerification.correctionRequested',
        relatedType: 'userVerification',
        relatedId: user.id,
        titleEn: `Corrections requested on your profile: ${reason}`,
        titleTe: `మీ ప్రొఫైల్‌లో దిద్దుబాట్లు కోరబడ్డాయి: ${reason}`,
      },
      t
    );

    await auditLog('userVerification.correctionRequest', actor, { userId, reason }, t);
    return getUserOrThrow(userId, t);
  });
}

async function recommend(userId, status, action, actor) {
  const user = await getUserOrThrow(userId);
  return sequelize.transaction(async (t) => {
    user.verificationStatus = status;
    await user.save({ transaction: t });
    await addHistory(userId, actor.id, action, { statusAfter: user.verificationStatus }, t);

    await createNotification(
      {
        audienceRole: ROLES.ADMIN,
        type: `userVerification.${action}`,
        relatedType: 'userVerification',
        relatedId: user.id,
        titleEn: `Employee recommendation on ${user.name}: ${action}`,
        titleTe: `ఉద్యోగి సిఫార్సు ${user.name}: ${action}`,
      },
      t
    );

    await auditLog(`userVerification.${action}`, actor, { userId }, t);
    return getUserOrThrow(userId, t);
  });
}

export const recommendApproval = (userId, actor) => recommend(userId, 'recommended_approval', 'recommend_approval', actor);
export const recommendRejection = (userId, actor) => recommend(userId, 'recommended_rejection', 'recommend_rejection', actor);

export async function complete(userId, actor) {
  const user = await getUserOrThrow(userId);
  return sequelize.transaction(async (t) => {
    user.verificationStatus = 'completed';
    await user.save({ transaction: t });
    await addHistory(userId, actor.id, 'complete', { statusAfter: user.verificationStatus }, t);
    await auditLog('userVerification.complete', actor, { userId }, t);
    return getUserOrThrow(userId, t);
  });
}
