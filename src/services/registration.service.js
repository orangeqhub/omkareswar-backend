import { Op } from 'sequelize';
import { sequelize, User, UserCorrectionHistory } from '../models/index.js';
import { ROLES } from '../constants/roles.js';
import { PERMISSIONS, ASSIGNABLE_EMPLOYEE_PERMISSIONS } from '../constants/permissions.js';
import AppError from '../utils/AppError.js';
import { buildUserScope } from '../utils/recordAccess.js';
import { generateSequentialId } from '../utils/idGenerator.js';
import { hashPassword } from '../utils/password.js';
import { toSafeUser } from '../utils/sanitize.js';
import { getPagination } from '../utils/pagination.js';
import * as otpService from './otp.service.js';
import { createNotification } from './notification.service.js';
import { log as auditLog } from './auditLog.service.js';
import { validateAndExtractRegistrationData } from './registrationForm.service.js';

const MEMBER_PREFIX = { buyer: 'BUY', seller: 'SEL', mediator: 'MED', employee: 'EMP' };
const REGISTERABLE_ROLES = [ROLES.BUYER, ROLES.SELLER, ROLES.MEDIATOR, ROLES.EMPLOYEE];

export async function requestRegistrationOtp(mobile) {
  return otpService.requestOtp(mobile, 'registration');
}

export async function verifyRegistrationOtp(mobile, otp) {
  await otpService.verifyOtp(mobile, otp, 'registration');
  return true;
}

export async function register(role, data) {
  if (!REGISTERABLE_ROLES.includes(role)) {
    throw new AppError('Invalid role for registration', 400, 'INVALID_ROLE');
  }

  const { standard, roleDetail, customFields, password } = await validateAndExtractRegistrationData(role, data);

  const existing = await User.findOne({ where: { mobile: standard.mobile } });
  if (existing) {
    throw new AppError('An account already exists with this mobile number', 409, 'MOBILE_EXISTS');
  }

  const result = await sequelize.transaction(async (t) => {
    const registrationId = await generateSequentialId('REG', t);
    const prefix = MEMBER_PREFIX[role];
    const isEmployee = role === ROLES.EMPLOYEE;

    // Employees start as pending and receive their memberId only after approval
    const memberId = (prefix && !isEmployee) ? await generateSequentialId(prefix, t) : null;
    const passwordHash = password ? await hashPassword(password) : null;
    const status = isEmployee ? 'pending' : 'approved';
    const verificationStatus = isEmployee ? 'pending_review' : 'completed';
    const approvedAt = isEmployee ? null : new Date();

    const user = await User.create(
      {
        role,
        registrationId,
        memberId,
        ...standard,
        roleDetail,
        customFields,
        passwordHash,
        tempPassword: isEmployee ? password : null,
        status,
        verificationStatus,
        approvedAt,
      },
      { transaction: t }
    );

    await createNotification(
      {
        audienceRole: ROLES.ADMIN,
        type: 'registration.new',
        relatedType: 'registration',
        relatedId: user.id,
        titleEn: `New ${role} registration: ${user.name}`,
        titleTe: `కొత్త ${role} నమోదు: ${user.name}`,
      },
      t
    );

    const action = isEmployee ? 'employee.registered' : 'registration.create';
    await auditLog(action, { id: user.id, role }, { registrationId, role }, t);

    return user;
  });

  const safe = toSafeUser(result);
  // The registrant just typed this password; echo it so the same value the
  // employee chose is what the admin panel shows after approval.
  if (role === ROLES.EMPLOYEE && password) safe.temporaryPassword = password;
  return safe;
}

export async function getApplicationStatus(mobile) {
  const user = await User.findOne({ where: { mobile } });
  if (!user) throw new AppError('No registration found for this mobile number', 404, 'USER_NOT_FOUND');
  return {
    registrationId: user.registrationId,
    memberId: user.memberId,
    role: user.role,
    status: user.status,
    rejectionReason: user.rejectionReason,
    correctionReason: user.correctionReason,
    correctionFields: user.correctionFields,
  };
}

export async function listPending(viewer, query) {
  const { page, pageSize, limit, offset } = getPagination(query);
  const where = { role: { [Op.in]: REGISTERABLE_ROLES } };

  if (query.status) {
    where.status = query.status;
  } else {
    where.status = { [Op.in]: ['pending', 'correction_requested'] };
  }

  if (viewer.role === ROLES.EMPLOYEE) {
    Object.assign(where, await buildUserScope(viewer));
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return { items: rows.map(toSafeUser), total: count, page, pageSize };
}

async function getRegistrationOrThrow(id) {
  const user = await User.findByPk(id);
  if (!user || !REGISTERABLE_ROLES.includes(user.role)) {
    throw new AppError('Registration not found', 404, 'NOT_FOUND');
  }
  return user;
}

export async function assignEmployee(id, employeeId, actor) {
  const user = await getRegistrationOrThrow(id);

  return sequelize.transaction(async (t) => {
    user.assignedEmployeeId = employeeId;
    await user.save({ transaction: t });

    await createNotification(
      {
        audienceUserId: employeeId,
        type: 'registration.assigned',
        relatedType: 'registration',
        relatedId: user.id,
        titleEn: `Registration assigned to you: ${user.name}`,
        titleTe: `మీకు నమోదు అప్పగించబడింది: ${user.name}`,
      },
      t
    );

    await auditLog('registration.assign', actor, { registrationId: user.id, employeeId }, t);
    return toSafeUser(user);
  });
}

export async function approve(id, actor) {
  const user = await getRegistrationOrThrow(id);
  if (user.status === 'approved' || user.status === 'active') {
    throw new AppError('Registration is already approved', 400, 'ALREADY_APPROVED');
  }

  return sequelize.transaction(async (t) => {
    const prefix = MEMBER_PREFIX[user.role];
    const memberId = await generateSequentialId(prefix, t);
    const isEmployee = user.role === ROLES.EMPLOYEE;

    user.memberId = memberId;
    user.status = isEmployee ? 'active' : 'approved';
    user.approvedBy = actor.id;
    user.approvedAt = new Date();
    user.verificationStatus = 'completed';
    
    if (isEmployee) {
      user.permissions = ASSIGNABLE_EMPLOYEE_PERMISSIONS.filter((p) => p !== PERMISSIONS.VIEW_UNASSIGNED_RECORDS);
    }
    
    await user.save({ transaction: t });

    await createNotification(
      {
        audienceUserId: user.id,
        type: 'registration.approved',
        relatedType: 'registration',
        relatedId: user.id,
        titleEn: `Your registration has been approved. Member ID: ${memberId}`,
        titleTe: `మీ నమోదు ఆమోదించబడింది. సభ్యుని ID: ${memberId}`,
      },
      t
    );

    const action = isEmployee ? 'employee.approved' : 'registration.approve';
    await auditLog(action, actor, { registrationId: user.id, employeeId: user.id, memberId }, t);

    const safe = toSafeUser(user);
    if (isEmployee && user.tempPassword && actor.role === ROLES.ADMIN) {
      safe.temporaryPassword = user.tempPassword;
    }
    return safe;
  });
}

export async function reject(id, reason, actor) {
  const user = await getRegistrationOrThrow(id);

  return sequelize.transaction(async (t) => {
    const isEmployee = user.role === ROLES.EMPLOYEE;
    user.status = 'rejected';
    user.rejectionReason = reason;
    await user.save({ transaction: t });

    await createNotification(
      {
        audienceUserId: user.id,
        type: 'registration.rejected',
        relatedType: 'registration',
        relatedId: user.id,
        titleEn: `Your registration was rejected: ${reason}`,
        titleTe: `మీ నమోదు తిరస్కరించబడింది: ${reason}`,
      },
      t
    );

    const action = isEmployee ? 'employee.rejected' : 'registration.reject';
    await auditLog(action, actor, { registrationId: user.id, employeeId: user.id, reason }, t);
    return toSafeUser(user);
  });
}

export async function requestCorrection(id, reason, fields, actor) {
  const user = await getRegistrationOrThrow(id);

  return sequelize.transaction(async (t) => {
    user.status = 'correction_requested';
    user.correctionReason = reason;
    user.correctionFields = fields || [];
    await user.save({ transaction: t });

    await UserCorrectionHistory.create(
      {
        userId: user.id,
        actorId: actor.id,
        action: 'correction_request',
        reason,
        fields: fields || [],
        statusAfter: user.status,
      },
      { transaction: t }
    );

    await createNotification(
      {
        audienceUserId: user.id,
        type: 'registration.correctionRequested',
        relatedType: 'registration',
        relatedId: user.id,
        titleEn: `Corrections requested on your registration: ${reason}`,
        titleTe: `మీ నమోదులో దిద్దుబాట్లు కోరబడ్డాయి: ${reason}`,
      },
      t
    );

    await auditLog('registration.requestCorrection', actor, { registrationId: user.id, reason, fields }, t);
    return toSafeUser(user);
  });
}
