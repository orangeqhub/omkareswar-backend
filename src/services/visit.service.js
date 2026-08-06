import { sequelize, Visit, VisitHistory, Property } from '../models/index.js';
import { PERMISSIONS } from '../constants/permissions.js';
import AppError from '../utils/AppError.js';
import { generateSequentialId } from '../utils/idGenerator.js';
import { getPagination } from '../utils/pagination.js';
import { createNotification } from './notification.service.js';
import { log as auditLog } from './auditLog.service.js';

const INCLUDE = [{ model: Property, as: 'property' }, { model: VisitHistory, as: 'history' }];

function formatDateTime(dateVal) {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
  } catch (err) {
    return String(dateVal);
  }
}

async function addHistory(visitId, actorId, action, note, statusAfter, transaction) {
  return VisitHistory.create({ visitId, actorId, action, note, statusAfter }, { transaction });
}

export async function createVisit(data, actor) {
  const property = await Property.findByPk(data.propertyId);
  if (!property) throw new AppError('Property not found', 404, 'NOT_FOUND');

  return sequelize.transaction(async (t) => {
    const visitCode = await generateSequentialId('VIS', t);

    const visit = await Visit.create(
      {
        visitCode,
        propertyId: data.propertyId,
        buyerId: data.buyerId,
        sellerId: data.sellerId || property.sellerId,
        buyerName: data.buyerName,
        scheduledFor: data.scheduledFor,
        meetingLocation: data.meetingLocation,
        status: 'scheduled',
      },
      { transaction: t }
    );

    await addHistory(visit.id, actor?.id || data.buyerId, 'create', null, 'scheduled', t);

    await createNotification(
      {
        audienceUserId: visit.sellerId,
        type: 'visit.new',
        relatedType: 'visit',
        relatedId: visit.id,
        titleEn: `New visit scheduled: ${visit.visitCode} on ${formatDateTime(visit.scheduledFor)}`,
        titleTe: `కొత్త సందర్శన షెడ్యూల్ చేయబడింది: ${visit.visitCode} (${formatDateTime(visit.scheduledFor)})`,
      },
      t
    );

    await auditLog('visit.create', actor, { visitId: visit.id }, t);
    return Visit.findByPk(visit.id, { include: INCLUDE, transaction: t });
  });
}

async function getOrThrow(id) {
  const visit = await Visit.findByPk(id);
  if (!visit) throw new AppError('Visit not found', 404, 'NOT_FOUND');
  return visit;
}

export async function getOne(id, transaction) {
  const visit = await Visit.findByPk(id, { include: INCLUDE, transaction });
  if (!visit) throw new AppError('Visit not found', 404, 'NOT_FOUND');
  return visit;
}

export async function listForBuyer(buyerId, query) {
  const { page, pageSize, limit, offset } = getPagination(query);
  const { rows, count } = await Visit.findAndCountAll({ where: { buyerId }, include: INCLUDE, order: [['scheduledFor', 'DESC']], limit, offset });
  return { items: rows, total: count, page, pageSize };
}

export async function listForSeller(sellerId, query) {
  const { page, pageSize, limit, offset } = getPagination(query);
  const { rows, count } = await Visit.findAndCountAll({ where: { sellerId }, include: INCLUDE, order: [['scheduledFor', 'DESC']], limit, offset });
  return { items: rows, total: count, page, pageSize };
}

export async function listForMediator(mediatorId, query) {
  const { page, pageSize, limit, offset } = getPagination(query);
  const { rows, count } = await Visit.findAndCountAll({
    where: { assignedMediatorId: mediatorId },
    include: INCLUDE,
    order: [['scheduledFor', 'DESC']],
    limit,
    offset,
  });
  return { items: rows, total: count, page, pageSize };
}

export async function listForEmployee(employee, query) {
  const { page, pageSize, limit, offset } = getPagination(query);
  const where = {};
  if (!(employee.permissions || []).includes(PERMISSIONS.VIEW_UNASSIGNED_RECORDS)) {
    where.assignedEmployeeId = employee.id;
  }
  const { rows, count } = await Visit.findAndCountAll({ where, include: INCLUDE, order: [['scheduledFor', 'DESC']], limit, offset });
  return { items: rows, total: count, page, pageSize };
}

export async function listForAdmin(query) {
  const { page, pageSize, limit, offset } = getPagination(query);
  const where = {};
  if (query.status) where.status = query.status;
  const { rows, count } = await Visit.findAndCountAll({ where, include: INCLUDE, order: [['scheduledFor', 'DESC']], limit, offset });
  return { items: rows, total: count, page, pageSize };
}

async function changeStatus(id, status, actor, action, note, extra = {}) {
  const visit = await getOrThrow(id);
  return sequelize.transaction(async (t) => {
    visit.status = status;
    Object.assign(visit, extra);
    await visit.save({ transaction: t });

    await addHistory(id, actor.id, action, note, status, t);

    await createNotification(
      {
        audienceUserId: visit.buyerId,
        type: 'visit.updated',
        relatedType: 'visit',
        relatedId: visit.id,
        titleEn: status === 'rescheduled'
          ? `Your visit ${visit.visitCode} has been rescheduled to ${formatDateTime(visit.scheduledFor)}`
          : `Your visit ${visit.visitCode} is now ${status}`,
        titleTe: status === 'rescheduled'
          ? `మీ సందర్శన ${visit.visitCode} ${formatDateTime(visit.scheduledFor)} కి మార్చబడింది`
          : `మీ సందర్శన ${visit.visitCode} ఇప్పుడు ${status}`,
      },
      t
    );

    await auditLog(`visit.${action}`, actor, { visitId: id, status }, t);
    return getOne(id, t);
  });
}

export const confirm = (id, actor) => changeStatus(id, 'confirmed', actor, 'confirm', null);
export const complete = (id, actor) => changeStatus(id, 'completed', actor, 'complete', null);
export const cancel = (id, actor, note) => changeStatus(id, 'cancelled', actor, 'cancel', note);
export const noShow = (id, actor, note) => changeStatus(id, 'no_show', actor, 'no_show', note);

export async function reschedule(id, scheduledFor, note, actor) {
  return changeStatus(id, 'rescheduled', actor, 'reschedule', note, { scheduledFor });
}

export async function addNote(id, note, actor) {
  const visit = await getOrThrow(id);
  await addHistory(id, actor.id, 'note', note, visit.status);
  await auditLog('visit.addNote', actor, { visitId: id });
  return getOne(id);
}

export async function setOutcome(id, outcome, actor) {
  const visit = await getOrThrow(id);
  visit.outcome = outcome;
  await visit.save();
  await addHistory(id, actor.id, 'outcome', outcome, visit.status);
  await auditLog('visit.outcome', actor, { visitId: id, outcome });
  return getOne(id);
}

export async function assign(id, { assignedMediatorId, assignedEmployeeId, assignmentNote, assignmentDueAt }, actor) {
  const visit = await getOrThrow(id);
  return sequelize.transaction(async (t) => {
    if (assignedMediatorId !== undefined) visit.assignedMediatorId = assignedMediatorId;
    if (assignedEmployeeId !== undefined) visit.assignedEmployeeId = assignedEmployeeId;
    visit.assignedBy = actor.id;
    visit.assignmentNote = assignmentNote;
    visit.assignmentDueAt = assignmentDueAt;
    await visit.save({ transaction: t });

    await addHistory(id, actor.id, 'assign', assignmentNote, visit.status, t);

    const audienceUserId = assignedEmployeeId || assignedMediatorId;
    if (audienceUserId) {
      await createNotification(
        {
          audienceUserId,
          type: 'visit.assigned',
          relatedType: 'visit',
          relatedId: visit.id,
          titleEn: `Visit assigned to you: ${visit.visitCode}`,
          titleTe: `మీకు సందర్శన కేటాయించబడింది: ${visit.visitCode}`,
        },
        t
      );
    }

    await auditLog('visit.assign', actor, { visitId: id, assignedMediatorId, assignedEmployeeId }, t);
    return getOne(id, t);
  });
}
