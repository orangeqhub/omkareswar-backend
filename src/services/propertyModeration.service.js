import { Op } from 'sequelize';
import { sequelize, Property, PropertyImage, PropertyDocument, PropertyModerationHistory } from '../models/index.js';
import { PERMISSIONS } from '../constants/permissions.js';
import { ROLES } from '../constants/roles.js';
import AppError from '../utils/AppError.js';
import { getPagination } from '../utils/pagination.js';
import { createNotification } from './notification.service.js';
import { log as auditLog } from './auditLog.service.js';

const INCLUDE = [
  { model: PropertyImage, as: 'images' },
  { model: PropertyDocument, as: 'documents' },
  { model: PropertyModerationHistory, as: 'moderationHistory' },
];

export async function listAssigned(employee, query) {
  const { page, pageSize, limit, offset } = getPagination(query);
  const where = { moderationStatus: { [Op.ne]: null } };

  if (!(employee.permissions || []).includes(PERMISSIONS.VIEW_UNASSIGNED_RECORDS)) {
    where.assignedEmployeeId = employee.id;
  }
  if (query.moderationStatus) where.moderationStatus = query.moderationStatus;

  const { rows, count } = await Property.findAndCountAll({
    where,
    include: INCLUDE,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });
  return { items: rows, total: count, page, pageSize };
}

async function getPropertyOrThrow(id, transaction) {
  const property = await Property.findByPk(id, { include: INCLUDE, transaction });
  if (!property) throw new AppError('Property not found', 404, 'NOT_FOUND');
  return property;
}

export async function getOne(id) {
  return getPropertyOrThrow(id);
}

async function addHistory(propertyId, actorId, action, extra, transaction) {
  return PropertyModerationHistory.create(
    { propertyId, actorId, action, ...extra },
    { transaction }
  );
}

export async function start(id, actor) {
  const property = await getPropertyOrThrow(id);
  return sequelize.transaction(async (t) => {
    property.moderationStatus = 'in_review';
    await property.save({ transaction: t });
    await addHistory(id, actor.id, 'start', { statusAfter: property.moderationStatus }, t);
    await auditLog('propertyModeration.start', actor, { propertyId: id }, t);
    return getPropertyOrThrow(id, t);
  });
}

export async function addNote(id, note, actor) {
  const property = await getPropertyOrThrow(id);
  return sequelize.transaction(async (t) => {
    await addHistory(id, actor.id, 'add_note', { note, statusAfter: property.moderationStatus }, t);
    await auditLog('propertyModeration.addNote', actor, { propertyId: id }, t);
    return getPropertyOrThrow(id, t);
  });
}

export async function requestChanges(id, { reason, fields, slots }, actor) {
  const property = await getPropertyOrThrow(id);
  return sequelize.transaction(async (t) => {
    property.moderationStatus = 'changes_requested';
    property.status = 'changes_requested';
    property.moderationNote = reason;
    await property.save({ transaction: t });

    await addHistory(id, actor.id, 'request_changes', { note: reason, fields, slots, statusAfter: property.moderationStatus }, t);

    await createNotification(
      {
        audienceUserId: property.sellerId,
        type: 'property.correctionRequested',
        relatedType: 'property',
        relatedId: property.id,
        titleEn: `Changes requested on your property: ${reason}`,
        titleTe: `మీ ఆస్తిపై మార్పులు అభ్యర్థించబడ్డాయి: ${reason}`,
      },
      t
    );
    await createNotification(
      {
        audienceRole: ROLES.ADMIN,
        type: 'property.correctionRequested',
        relatedType: 'property',
        relatedId: property.id,
        titleEn: `Employee requested changes on property ${property.propertyCode}`,
        titleTe: `ఉద్యోగి ఆస్తి ${property.propertyCode}పై మార్పులు కోరారు`,
      },
      t
    );

    await auditLog('propertyModeration.requestChanges', actor, { propertyId: id, reason }, t);
    return getPropertyOrThrow(id, t);
  });
}

async function recommend(id, status, action, actor) {
  const property = await getPropertyOrThrow(id);
  return sequelize.transaction(async (t) => {
    property.moderationStatus = status;
    await property.save({ transaction: t });
    await addHistory(id, actor.id, action, { statusAfter: property.moderationStatus }, t);

    await createNotification(
      {
        audienceRole: ROLES.ADMIN,
        type: `property.${action}`,
        relatedType: 'property',
        relatedId: property.id,
        titleEn: `Employee recommendation on ${property.propertyCode}: ${action}`,
        titleTe: `ఉద్యోగి సిఫార్సు ${property.propertyCode}: ${action}`,
      },
      t
    );

    await auditLog(`propertyModeration.${action}`, actor, { propertyId: id }, t);
    return getPropertyOrThrow(id, t);
  });
}

export const recommendApproval = (id, actor) => recommend(id, 'recommended_approval', 'recommend_approval', actor);
export const recommendRejection = (id, actor) => recommend(id, 'recommended_rejection', 'recommend_rejection', actor);

export async function complete(id, actor) {
  const property = await getPropertyOrThrow(id);
  return sequelize.transaction(async (t) => {
    property.moderationStatus = 'completed';
    await property.save({ transaction: t });
    await addHistory(id, actor.id, 'complete', { statusAfter: property.moderationStatus }, t);
    await auditLog('propertyModeration.complete', actor, { propertyId: id }, t);
    return getPropertyOrThrow(id, t);
  });
}
