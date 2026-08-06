import { Op } from 'sequelize';
import { sequelize, User, UserCorrectionHistory } from '../models/index.js';
import { ROLES } from '../constants/roles.js';
import { PERMISSIONS } from '../constants/permissions.js';
import AppError from '../utils/AppError.js';
import { generateSequentialId } from '../utils/idGenerator.js';
import { hashPassword } from '../utils/password.js';
import { toSafeUser } from '../utils/sanitize.js';
import { getPagination } from '../utils/pagination.js';
import * as otpService from './otp.service.js';
import { createNotification } from './notification.service.js';
import { log as auditLog } from './auditLog.service.js';

const MEMBER_PREFIX = { buyer: 'BUY', seller: 'SEL', mediator: 'MED' };
const REGISTERABLE_ROLES = [ROLES.BUYER, ROLES.SELLER, ROLES.MEDIATOR];

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

  const existing = await User.findOne({ where: { mobile: data.mobile } });
  if (existing) {
    throw new AppError('An account already exists with this mobile number', 409, 'MOBILE_EXISTS');
  }

  const result = await sequelize.transaction(async (t) => {
    const registrationId = await generateSequentialId('REG', t);
    const passwordHash = data.password ? await hashPassword(data.password) : null;

    const user = await User.create(
      {
        role,
        registrationId,
        name: data.name,
        mobile: data.mobile,
        altMobile: data.altMobile,
        email: data.email,
        passwordHash,
        district: data.district,
        city: data.city,
        address: data.address,
        roleDetail: data.roleDetail || {},
        status: 'pending',
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

    await auditLog('registration.create', { id: user.id, role }, { registrationId, role }, t);

    return user;
  });

  return toSafeUser(result);
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

  if (viewer.role === ROLES.EMPLOYEE && !(viewer.permissions || []).includes(PERMISSIONS.VIEW_UNASSIGNED_RECORDS)) {
    where.assignedEmployeeId = viewer.id;
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

    user.memberId = memberId;
    user.status = 'approved';
    user.approvedBy = actor.id;
    user.approvedAt = new Date();
    user.verificationStatus = 'completed';
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

    await auditLog('registration.approve', actor, { registrationId: user.id, memberId }, t);
    return toSafeUser(user);
  });
}

export async function reject(id, reason, actor) {
  const user = await getRegistrationOrThrow(id);

  return sequelize.transaction(async (t) => {
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

    await auditLog('registration.reject', actor, { registrationId: user.id, reason }, t);
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
