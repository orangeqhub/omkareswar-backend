import { Op } from 'sequelize';
import { sequelize, User, Enquiry, Visit, FollowUp, Property, AuditLog } from '../models/index.js';
import { ROLES } from '../constants/roles.js';
import { ASSIGNABLE_EMPLOYEE_PERMISSIONS } from '../constants/permissions.js';
import AppError from '../utils/AppError.js';
import { generateSequentialId } from '../utils/idGenerator.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { toSafeUser } from '../utils/sanitize.js';
import { getPagination } from '../utils/pagination.js';
import { createNotification } from './notification.service.js';
import { log as auditLog } from './auditLog.service.js';
import { validateAndExtractRegistrationData } from './registrationForm.service.js';

// Attaches the stored plaintext password only for admin callers. toSafeUser
// always strips it, so without this the admin panel could not display the
// password the employee chose for themselves.
function withAdminPassword(safe, user, actor) {
  if (actor && actor.role === ROLES.ADMIN && user.tempPassword) {
    safe.temporaryPassword = user.tempPassword;
  }
  return safe;
}

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

  return {
    items: rows.map((u) => withAdminPassword(toSafeUser(u), u, viewer)),
    total: count,
    page,
    pageSize,
  };
}

export async function getUser(id, actor) {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  return withAdminPassword(toSafeUser(user), user, actor);
}

export async function updateUser(id, data, actor) {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

  const editable = ['name', 'mobile', 'altMobile', 'email', 'district', 'city', 'address', 'profileImage', 'roleDetail'];
  const changes = [];

  editable.forEach((field) => {
    if (data[field] !== undefined) {
      const oldVal = user[field];
      const newVal = data[field];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({
          field,
          oldValue: oldVal,
          newValue: newVal,
        });
        user[field] = newVal;
      }
    }
  });

  let passwordChanged = false;
  let oldPassword = null;
  if (data.password) {
    oldPassword = user.tempPassword;
    user.passwordHash = await hashPassword(data.password);
    user.tempPassword = data.password;
    passwordChanged = true;
  }

  await user.save();

  const isEmployee = user.role === ROLES.EMPLOYEE;
  const logAction = isEmployee ? 'employee.profileChanged' : 'user.profileChanged';

  for (const change of changes) {
    await auditLog(logAction, actor || user, {
      userId: user.id,
      userName: user.name,
      role: user.role,
      field: change.field,
      oldValue: change.oldValue,
      newValue: change.newValue,
    });
  }

  if (passwordChanged) {
    const pwdAction = isEmployee ? 'employee.passwordChanged' : 'user.passwordChanged';
    await auditLog(pwdAction, actor || user, {
      userId: user.id,
      userName: user.name,
      role: user.role,
      field: 'password',
      oldValue: oldPassword || 'N/A',
      newValue: data.password,
      message: isEmployee ? 'Employee changed password' : 'User updated account security information',
    });
  }

  await auditLog('user.update', actor || user, { userId: id });
  const safe = toSafeUser(user);
  if (passwordChanged && actor?.role === ROLES.ADMIN) {
    safe.temporaryPassword = data.password;
  }
  return safe;
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
  const { standard, roleDetail, customFields, password } = await validateAndExtractRegistrationData(ROLES.EMPLOYEE, data, { allowPermissions: true });
  if (!password) {
    throw new AppError('Password is required for employee creation', 400, 'VALIDATION_ERROR');
  }

  const existing = await User.findOne({ where: { mobile: standard.mobile } });
  if (existing) throw new AppError('An account already exists with this mobile number', 409, 'MOBILE_EXISTS');

  const permissions = (data.permissions || []).filter((p) => ASSIGNABLE_EMPLOYEE_PERMISSIONS.includes(p));

  return sequelize.transaction(async (t) => {
    const memberId = await generateSequentialId('EMP', t);
    const passwordHash = await hashPassword(password);

    const employee = await User.create(
      {
        role: ROLES.EMPLOYEE,
        memberId,
        ...standard,
        roleDetail,
        customFields,
        passwordHash,
        tempPassword: password,
        permissions,
        status: 'active',
        approvedBy: actor.id,
        approvedAt: new Date(),
      },
      { transaction: t }
    );

    await auditLog('employee.create', actor, { employeeId: employee.id, memberId }, t);
    const safe = toSafeUser(employee);
    if (actor?.role === ROLES.ADMIN) {
      safe.temporaryPassword = password;
    }
    return safe;
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

export async function assignEmployee(id, employeeId, actor, reason = 'Initial assignment') {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

  let employee = null;
  if (employeeId) {
    employee = await User.findOne({ where: { id: employeeId, role: ROLES.EMPLOYEE } });
    if (!employee) throw new AppError('Employee not found', 404, 'USER_NOT_FOUND');
  }

  const previousEmployeeId = user.assignedEmployeeId;

  return sequelize.transaction(async (t) => {
    user.assignedEmployeeId = employeeId || null;
    await user.save({ transaction: t });

    if (employeeId) {
      await createNotification(
        {
          audienceUserId: employeeId,
          type: 'user.assigned',
          relatedType: 'user',
          relatedId: user.id,
          titleEn: `Customer assigned to you: ${user.name}`,
          titleTe: `కస్టమర్ మీకు కేటాయించబడింది: ${user.name}`,
        },
        t
      );
    }

    await auditLog('user.assignEmployee', actor, {
      userId: id,
      previousEmployeeId,
      newEmployeeId: employeeId || null,
      reason,
    }, t);

    return toSafeUser(user);
  });
}

export async function deleteUser(id, actor) {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  await user.destroy();
  await auditLog('user.delete', actor, { userId: id }, undefined);
}

export async function createUser(data, actor) {
  const existing = await User.findOne({ where: { mobile: data.mobile } });
  if (existing) throw new AppError('An account already exists with this mobile number', 409, 'MOBILE_EXISTS');

  let memberId = null;
  if (data.role === ROLES.MEDIATOR) {
    memberId = await generateSequentialId('MED', null);
  } else if (data.role === ROLES.EMPLOYEE) {
    memberId = await generateSequentialId('EMP', null);
  }

  const passwordHash = data.password ? await hashPassword(data.password) : null;

  const user = await User.create({
    role: data.role,
    memberId,
    name: data.name,
    mobile: data.mobile,
    altMobile: data.altMobile,
    email: data.email,
    passwordHash,
    tempPassword: data.password || null,
    district: data.district,
    city: data.city,
    address: data.address,
    status: 'approved',
  });

  await auditLog('user.create', actor, { userId: user.id }, null);
  const safe = toSafeUser(user);
  if (data.password && actor?.role === ROLES.ADMIN) {
    safe.temporaryPassword = data.password;
  }
  return safe;
}

export async function getEmployeeDetail(id, actor) {
  const employee = await User.findOne({ where: { id, role: ROLES.EMPLOYEE } });
  if (!employee) throw new AppError('Employee not found', 404, 'USER_NOT_FOUND');

  const buyers = await User.findAll({ where: { assignedEmployeeId: id, role: ROLES.BUYER } });
  const sellers = await User.findAll({ where: { assignedEmployeeId: id, role: ROLES.SELLER } });
  const mediators = await User.findAll({ where: { assignedEmployeeId: id, role: ROLES.MEDIATOR } });
  
  const enquiries = await Enquiry.findAll({ where: { assignedEmployeeId: id } });
  const visits = await Visit.findAll({ where: { assignedEmployeeId: id } });
  const followUps = await FollowUp.findAll({ where: { assignedEmployeeId: id } });
  const properties = await Property.findAll({ where: { assignedEmployeeId: id } });

  // Fetch Daily Activity: Audit logs where actorId = employee.id
  const dailyActivity = await AuditLog.findAll({
    where: { actorId: id },
    order: [['createdAt', 'DESC']],
    limit: 100
  });

  // Fetch Profile Change History: Audit logs where target user is this employee
  const profileHistory = await AuditLog.findAll({
    where: {
      action: { [Op.in]: ['employee.profileChanged', 'employee.passwordChanged'] },
      [Op.or]: [
        { details: { userId: id } },
        { details: { employeeId: id } }
      ]
    },
    order: [['createdAt', 'DESC']]
  });

  return {
    profile: withAdminPassword(toSafeUser(employee), employee, actor),
    assignedWork: {
      buyers: buyers.map(toSafeUser),
      sellers: sellers.map(toSafeUser),
      mediators: mediators.map(toSafeUser),
      enquiries,
      visits,
      followUps,
      properties
    },
    dailyActivity,
    profileHistory
  };
}

export async function getUserDetail(id, actor) {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

  // Related properties (for sellers/mediators/buyers)
  const properties = await Property.findAll({
    where: {
      [Op.or]: [
        { sellerId: id },
        { assignedMediatorId: id }
      ]
    }
  });

  // Related enquiries/visits
  const enquiries = await Enquiry.findAll({
    where: {
      [Op.or]: [
        { buyerId: id },
        { sellerId: id }
      ]
    }
  });

  const visits = await Visit.findAll({
    where: {
      [Op.or]: [
        { buyerId: id },
        { sellerId: id }
      ]
    }
  });

  // Activity / Change History (Audit logs for this user)
  const activityHistory = await AuditLog.findAll({
    where: {
      [Op.or]: [
        { actorId: id },
        { details: { userId: id } }
      ]
    },
    order: [['createdAt', 'DESC']],
    limit: 100
  });

  return {
    profile: withAdminPassword(toSafeUser(user), user, actor),
    properties,
    enquiries,
    visits,
    activityHistory
  };
}

export async function changeOwnPassword(user, { currentPassword, newPassword }) {
  if (!user) throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) {
    throw new AppError('Current password is incorrect', 400, 'CURRENT_PASSWORD_WRONG');
  }
  if (String(newPassword).length < 6) {
    throw new AppError('New password must be at least 6 characters', 400, 'PASSWORD_TOO_SHORT');
  }
  if (newPassword === currentPassword) {
    throw new AppError('New password must be different from the current password', 400, 'PASSWORD_UNCHANGED');
  }

  return sequelize.transaction(async (t) => {
    const oldPassword = user.tempPassword;
    user.passwordHash = await hashPassword(newPassword);
    user.tempPassword = newPassword;
    await user.save({ transaction: t });

    const isEmployee = user.role === ROLES.EMPLOYEE;
    const action = isEmployee ? 'employee.passwordChanged' : 'user.passwordChanged';

    await auditLog(action, user, {
      userId: user.id,
      userName: user.name,
      role: user.role,
      field: 'password',
      oldValue: oldPassword || 'N/A',
      newValue: newPassword,
      message: isEmployee ? 'Employee changed password' : 'User updated account security information',
    }, t);

    // The admin panel is the one place that surfaces employee-chosen passwords,
    // so every self-service password change is broadcast to admins as well.
    await createNotification(
      {
        audienceRole: ROLES.ADMIN,
        type: action,
        relatedType: 'user',
        relatedId: user.id,
        titleEn: `${user.name} (${user.memberId || 'No member ID'}) updated their password. New password: ${newPassword}`,
        titleTe: `${user.name} (${user.memberId || 'No member ID'}) తమ పాస్‌వర్డ్‌ను మార్చారు. కొత్త పాస్‌వర్డ్: ${newPassword}`,
      },
      t
    );

    return toSafeUser(user);
  });
}
