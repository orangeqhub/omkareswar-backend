import { Op } from 'sequelize';
import { User, Enquiry, Visit, Property } from '../models/index.js';
import { ROLES } from '../constants/roles.js';
import AppError from './AppError.js';

export async function getAssignedUserIds(employeeId) {
  const rows = await User.findAll({
    where: { assignedEmployeeId: employeeId },
    attributes: ['id'],
  });
  return rows.map((r) => r.id);
}

async function buildOwnerOr(ownerKeys, userIds) {
  if (!userIds.length) return [];
  return ownerKeys.map((key) => ({ [key]: { [Op.in]: userIds } }));
}

/**
 * Scope for employee list queries on records that carry an assignedEmployeeId
 * plus owner columns (buyerId/sellerId). Returns an empty object when the
 * employee may view unassigned records. Otherwise returns a where clause that
 * matches records assigned directly to the employee OR linked to a user that
 * has been assigned to them at the user level.
 */
export async function buildRecordScope(employee, ownerKeys) {
  const userIds = await getAssignedUserIds(employee.id);
  return {
    [Op.or]: [{ assignedEmployeeId: employee.id }, ...(await buildOwnerOr(ownerKeys, userIds))],
  };
}

/**
 * Scope for employee queries over the users table itself (registrations,
 * verifications): the employee's own assigned user records plus any user
 * assigned to them at the user level.
 */
export async function buildUserScope(employee) {
  const userIds = await getAssignedUserIds(employee.id);
  return {
    [Op.or]: [{ assignedEmployeeId: employee.id }, ...(userIds.length ? [{ id: { [Op.in]: userIds } }] : [])],
  };
}

async function resolveRecordOwnerIds(followUp) {
  if (followUp.recordType === 'userVerification') {
    return [followUp.recordId];
  }
  if (followUp.recordType === 'enquiry') {
    const enquiry = await Enquiry.findByPk(followUp.recordId, { attributes: ['buyerId', 'sellerId'] });
    return enquiry ? [enquiry.buyerId, enquiry.sellerId].filter(Boolean) : [];
  }
  if (followUp.recordType === 'visit') {
    const visit = await Visit.findByPk(followUp.recordId, { attributes: ['buyerId', 'sellerId'] });
    return visit ? [visit.buyerId, visit.sellerId].filter(Boolean) : [];
  }
  if (followUp.recordType === 'property') {
    const property = await Property.findByPk(followUp.recordId, { attributes: ['sellerId'] });
    return property ? [property.sellerId].filter(Boolean) : [];
  }
  return [];
}

/**
 * Scope for employee follow-up lists: follow-ups assigned to the employee,
 * plus follow-ups whose underlying record belongs to a user assigned to the
 * employee at the user level.
 */
export async function buildFollowUpScope(employee) {
  const userIds = await getAssignedUserIds(employee.id);
  const or = [{ assignedEmployeeId: employee.id }];

  if (userIds.length) {
    const [enquiryRows, visitRows, propertyRows] = await Promise.all([
      Enquiry.findAll({ where: { [Op.or]: await buildOwnerOr(['buyerId', 'sellerId'], userIds) }, attributes: ['id'] }),
      Visit.findAll({ where: { [Op.or]: await buildOwnerOr(['buyerId', 'sellerId'], userIds) }, attributes: ['id'] }),
      Property.findAll({ where: { sellerId: { [Op.in]: userIds } }, attributes: ['id'] }),
    ]);
    const recordIds = [...userIds, ...enquiryRows.map((r) => r.id), ...visitRows.map((r) => r.id), ...propertyRows.map((r) => r.id)];
    if (recordIds.length) or.push({ recordId: { [Op.in]: recordIds } });
  }

  return { [Op.or]: or };
}

async function hasLinkedUserAccess(actor, ownerIds) {
  const userIds = await getAssignedUserIds(actor.id);
  return userIds.some((id) => ownerIds.includes(id));
}

/**
 * Throws 404 for employees (and other non-admin roles) that are not allowed to
 * access a record. Admin always passes. ownerKeys are the columns that identify
 * the owning user(s) of the record (e.g. buyerId/sellerId).
 */
export async function assertRecordAccess(actor, record, ownerKeys) {
  if (!actor || actor.role === ROLES.ADMIN) return;
  if (actor.role === ROLES.EMPLOYEE) {
    if (record.assignedEmployeeId === actor.id) return;
    if (await hasLinkedUserAccess(actor, ownerKeys.map((key) => record[key]).filter(Boolean))) return;
    throw new AppError('Record not found', 404, 'NOT_FOUND');
  }
  if (actor.role === ROLES.MEDIATOR) {
    if (record.assignedMediatorId === actor.id) return;
    throw new AppError('Record not found', 404, 'NOT_FOUND');
  }
  const isOwner = ownerKeys.some((key) => record[key] === actor.id);
  if (!isOwner) throw new AppError('Record not found', 404, 'NOT_FOUND');
}

/**
 * Access check for user records (verifications, registrations).
 */
export async function assertUserRecordAccess(actor, user) {
  if (!actor || actor.role === ROLES.ADMIN) return;
  if (actor.role === ROLES.EMPLOYEE) {
    if (user.assignedEmployeeId === actor.id) return;
    if (await hasLinkedUserAccess(actor, [user.id])) return;
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }
  throw new AppError('User not found', 404, 'NOT_FOUND');
}

/**
 * Access check for follow-ups (polymorphic recordId).
 */
export async function assertFollowUpAccess(actor, followUp) {
  if (!actor || actor.role === ROLES.ADMIN) return;
  if (actor.role === ROLES.EMPLOYEE) {
    if (followUp.assignedEmployeeId === actor.id) return;
    const ownerIds = await resolveRecordOwnerIds(followUp);
    if (await hasLinkedUserAccess(actor, ownerIds)) return;
    throw new AppError('Follow-up not found', 404, 'NOT_FOUND');
  }
  throw new AppError('Follow-up not found', 404, 'NOT_FOUND');
}
