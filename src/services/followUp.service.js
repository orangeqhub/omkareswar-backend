import { sequelize, FollowUp, FollowUpHistory } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { getPagination } from '../utils/pagination.js';
import { buildFollowUpScope, assertFollowUpAccess } from '../utils/recordAccess.js';
import { createNotification } from './notification.service.js';
import { log as auditLog } from './auditLog.service.js';

const INCLUDE = [{ model: FollowUpHistory, as: 'history' }];

function withOverdue(followUp) {
  const plain = followUp.toJSON ? followUp.toJSON() : followUp;
  const dueDateTime = new Date(`${plain.dueDate}T${plain.dueTime || '23:59'}`);
  plain.overdue = dueDateTime < new Date() && !['completed', 'cancelled'].includes(plain.status);
  return plain;
}

async function addHistory(followUpId, actorId, action, note, statusAfter, transaction) {
  return FollowUpHistory.create({ followUpId, actorId, action, note, statusAfter }, { transaction });
}

async function getOrThrow(id, transaction) {
  const followUp = await FollowUp.findByPk(id, { include: INCLUDE, transaction });
  if (!followUp) throw new AppError('Follow-up not found', 404, 'NOT_FOUND');
  return followUp;
}

export async function listForEmployee(employee, query) {
  const { page, pageSize, limit, offset } = getPagination(query);
  const where = {};
  Object.assign(where, await buildFollowUpScope(employee));
  if (query.status) where.status = query.status;
  if (query.recordType) where.recordType = query.recordType;

  const { rows, count } = await FollowUp.findAndCountAll({ where, include: INCLUDE, order: [['dueDate', 'ASC']], limit, offset });
  return { items: rows.map(withOverdue), total: count, page, pageSize };
}

export async function listForAdmin(query) {
  const { page, pageSize, limit, offset } = getPagination(query);
  const where = {};
  if (query.status) where.status = query.status;
  if (query.recordType) where.recordType = query.recordType;

  const { rows, count } = await FollowUp.findAndCountAll({ where, include: INCLUDE, order: [['dueDate', 'ASC']], limit, offset });
  return { items: rows.map(withOverdue), total: count, page, pageSize };
}

export async function create(data, actor) {
  return sequelize.transaction(async (t) => {
    const followUp = await FollowUp.create(
      {
        recordType: data.recordType,
        recordId: data.recordId,
        assignedEmployeeId: data.assignedEmployeeId,
        assignedBy: actor.id,
        dueDate: data.dueDate,
        dueTime: data.dueTime,
        priority: data.priority || 'medium',
        reason: data.reason,
        nextAction: data.nextAction,
        status: 'assigned',
      },
      { transaction: t }
    );

    await addHistory(followUp.id, actor.id, 'create', data.reason, 'assigned', t);

    await createNotification(
      {
        audienceUserId: data.assignedEmployeeId,
        type: 'followup.assigned',
        relatedType: data.recordType,
        relatedId: data.recordId,
        titleEn: `New follow-up assigned to you (due ${data.dueDate})`,
        titleTe: `మీకు కొత్త ఫాలో-అప్ కేటాయించబడింది (గడువు ${data.dueDate})`,
      },
      t
    );

    await auditLog('followup.create', actor, { followUpId: followUp.id }, t);
    return withOverdue(await getOrThrow(followUp.id, t));
  });
}

export async function start(id, actor) {
  const followUp = await getOrThrow(id);
  await assertFollowUpAccess(actor, followUp);
  return sequelize.transaction(async (t) => {
    followUp.status = 'in_progress';
    await followUp.save({ transaction: t });
    await addHistory(id, actor.id, 'start', null, followUp.status, t);
    await auditLog('followup.start', actor, { followUpId: id }, t);
    return withOverdue(await getOrThrow(id, t));
  });
}

export async function reschedule(id, { dueDate, dueTime, note }, actor) {
  const followUp = await getOrThrow(id);
  await assertFollowUpAccess(actor, followUp);
  return sequelize.transaction(async (t) => {
    followUp.dueDate = dueDate;
    followUp.dueTime = dueTime;
    await followUp.save({ transaction: t });
    await addHistory(id, actor.id, 'reschedule', note, followUp.status, t);
    await auditLog('followup.reschedule', actor, { followUpId: id, dueDate, dueTime }, t);
    return withOverdue(await getOrThrow(id, t));
  });
}

export async function complete(id, completionNote, actor) {
  const followUp = await getOrThrow(id);
  await assertFollowUpAccess(actor, followUp);
  return sequelize.transaction(async (t) => {
    followUp.status = 'completed';
    followUp.completionNote = completionNote;
    await followUp.save({ transaction: t });
    await addHistory(id, actor.id, 'complete', completionNote, followUp.status, t);
    await auditLog('followup.complete', actor, { followUpId: id }, t);
    return withOverdue(await getOrThrow(id, t));
  });
}

export async function cancel(id, note, actor) {
  const followUp = await getOrThrow(id);
  await assertFollowUpAccess(actor, followUp);
  return sequelize.transaction(async (t) => {
    followUp.status = 'cancelled';
    await followUp.save({ transaction: t });
    await addHistory(id, actor.id, 'cancel', note, followUp.status, t);
    await auditLog('followup.cancel', actor, { followUpId: id }, t);
    return withOverdue(await getOrThrow(id, t));
  });
}

export async function addNote(id, note, actor) {
  const followUp = await getOrThrow(id);
  await assertFollowUpAccess(actor, followUp);
  await addHistory(id, actor.id, 'note', note, followUp.status);
  await auditLog('followup.addNote', actor, { followUpId: id });
  return withOverdue(await getOrThrow(id));
}

export async function adminAssign(id, { assignedEmployeeId, assignmentNote }, actor) {
  const followUp = await getOrThrow(id);
  return sequelize.transaction(async (t) => {
    followUp.assignedEmployeeId = assignedEmployeeId;
    await followUp.save({ transaction: t });
    await addHistory(id, actor.id, 'assign', assignmentNote, followUp.status, t);

    await createNotification(
      {
        audienceUserId: assignedEmployeeId,
        type: 'followup.assigned',
        relatedType: followUp.recordType,
        relatedId: followUp.recordId,
        titleEn: `Follow-up re-assigned to you (due ${followUp.dueDate})`,
        titleTe: `ఫాలో-అప్ మీకు తిరిగి కేటాయించబడింది (గడువు ${followUp.dueDate})`,
      },
      t
    );

    await auditLog('followup.assign', actor, { followUpId: id, assignedEmployeeId }, t);
    return withOverdue(await getOrThrow(id, t));
  });
}
