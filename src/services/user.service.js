import { sequelize, User } from '../models/index.js';
import { ROLES } from '../constants/roles.js';
import { ASSIGNABLE_EMPLOYEE_PERMISSIONS } from '../constants/permissions.js';
import AppError from '../utils/AppError.js';
import { generateSequentialId } from '../utils/idGenerator.js';
import { hashPassword } from '../utils/password.js';
import { toSafeUser } from '../utils/sanitize.js';
import { getPagination } from '../utils/pagination.js';
import { createNotification } from './notification.service.js';
import { log as auditLog } from './auditLog.service.js';

export async function listUsers(viewer, query) {
  const { page, pageSize, limit, offset } = getPagination(query);
  const where = {};
  if (query.role) where.role = query.role;
  if (query.status) where.status = query.status;

  if (viewer.role === ROLES.MEDIATOR) {
    where.assignedMediatorId = viewer.id;
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return { items: rows.map(toSafeUser), total: count, page, pageSize };
}

export async function getUser(id) {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  return toSafeUser(user);
}

export async function updateUser(id, data, actor) {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

  const editable = ['name', 'altMobile', 'email', 'district', 'city', 'address', 'profileImage', 'roleDetail'];
  editable.forEach((field) => {
    if (data[field] !== undefined) user[field] = data[field];
  });
  await user.save();
  await auditLog('user.update', actor, { userId: id }, undefined);
  return toSafeUser(user);
}

export async function updateStatus(id, status, actor) {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

  return sequelize.transaction(async (t) => {
    user.status = status;
    await user.save({ transaction: t });

    await createNotification(
      {
        audienceUserId: user.id,
        type: 'user.statusUpdated',
        relatedType: 'user',
        relatedId: user.id,
        titleEn: `Your account status was updated to ${status}`,
        titleTe: `మీ ఖాతా స్థితి ${status}కి మార్చబడింది`,
      },
      t
    );

    await auditLog('user.statusUpdate', actor, { userId: id, status }, t);
    return toSafeUser(user);
  });
}

export async function createEmployee(data, actor) {
  const existing = await User.findOne({ where: { mobile: data.mobile } });
  if (existing) throw new AppError('An account already exists with this mobile number', 409, 'MOBILE_EXISTS');

  const permissions = (data.permissions || []).filter((p) => ASSIGNABLE_EMPLOYEE_PERMISSIONS.includes(p));

  return sequelize.transaction(async (t) => {
    const memberId = await generateSequentialId('EMP', t);
    const passwordHash = await hashPassword(data.password);

    const employee = await User.create(
      {
        role: ROLES.EMPLOYEE,
        memberId,
        name: data.name,
        mobile: data.mobile,
        altMobile: data.altMobile,
        email: data.email,
        passwordHash,
        district: data.district,
        city: data.city,
        address: data.address,
        permissions,
        status: 'active',
        approvedBy: actor.id,
        approvedAt: new Date(),
      },
      { transaction: t }
    );

    await auditLog('employee.create', actor, { employeeId: employee.id, memberId }, t);
    return toSafeUser(employee);
  });
}

export async function updateEmployeePermissions(id, permissions, actor) {
  const employee = await User.findOne({ where: { id, role: ROLES.EMPLOYEE } });
  if (!employee) throw new AppError('Employee not found', 404, 'USER_NOT_FOUND');

  const filtered = (permissions || []).filter((p) => ASSIGNABLE_EMPLOYEE_PERMISSIONS.includes(p));
  employee.permissions = filtered;
  await employee.save();
  await auditLog('employee.permissionsUpdated', actor, { employeeId: id, permissions: filtered });
  return toSafeUser(employee);
}

export async function updateEmployeeStatus(id, status, actor) {
  const employee = await User.findOne({ where: { id, role: ROLES.EMPLOYEE } });
  if (!employee) throw new AppError('Employee not found', 404, 'USER_NOT_FOUND');

  employee.status = status;
  await employee.save();
  await auditLog('employee.statusUpdate', actor, { employeeId: id, status });
  return toSafeUser(employee);
}

export async function assignMediator(id, mediatorId, actor) {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

  const mediator = await User.findOne({ where: { id: mediatorId, role: ROLES.MEDIATOR } });
  if (!mediator) throw new AppError('Mediator not found', 404, 'USER_NOT_FOUND');

  return sequelize.transaction(async (t) => {
    user.assignedMediatorId = mediatorId;
    await user.save({ transaction: t });

    await createNotification(
      {
        audienceUserId: mediatorId,
        type: 'user.mediatorAssigned',
        relatedType: 'user',
        relatedId: user.id,
        titleEn: `You have been assigned as mediator for ${user.name}`,
        titleTe: `${user.name} కోసం మధ్యవర్తిగా మీకు కేటాయించబడింది`,
      },
      t
    );

    await auditLog('user.assignMediator', actor, { userId: id, mediatorId }, t);
    return toSafeUser(user);
  });
}
