import { Op } from 'sequelize';
import { User } from '../models/index.js';
import { PUBLIC_OTP_ROLES, ROLES } from '../constants/roles.js';
import AppError from '../utils/AppError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { toSafeUser } from '../utils/sanitize.js';
import * as otpService from './otp.service.js';

function assertLoginableStatus(user) {
  if (user.status === 'pending') throw new AppError('Your registration is pending approval', 403, 'ACCOUNT_PENDING');
  if (user.status === 'rejected') throw new AppError('Your registration was rejected', 403, 'ACCOUNT_REJECTED');
  if (user.status === 'correction_requested') {
    throw new AppError('Your registration requires corrections before you can log in', 403, 'ACCOUNT_PENDING');
  }
  if (user.status === 'inactive') throw new AppError('Your account has been deactivated', 403, 'ACCOUNT_INACTIVE');
}

function issueTokens(user) {
  const payload = { id: user.id, role: user.role, memberId: user.memberId };
  return {
    token: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}
export async function requestPublicOtp(mobile) {
  const user = await User.findOne({
    where: { mobile },
  });

  if (!user) {
    throw new AppError(
      'No account found for this mobile number',
      404,
      'USER_NOT_FOUND'
    );
  }

  if (!PUBLIC_OTP_ROLES.includes(user.role)) {
    throw new AppError(
      'This login method is not allowed for your account',
      403,
      'ROLE_NOT_ALLOWED'
    );
  }

  /*
   * Pending/rejected/inactive users ki OTP create cheyyakunda
   * application status page ki redirect cheyyadaniki.
   */
  // assertLoginableStatus(user);

  return otpService.requestOtp(mobile, 'login');
}
export async function loginPublicWithOtp(mobile, otp) {
  const user = await User.findOne({ where: { mobile } });
  if (!user) throw new AppError('No account found for this mobile number', 404, 'USER_NOT_FOUND');
  if (!PUBLIC_OTP_ROLES.includes(user.role)) {
    throw new AppError('This login method is not allowed for your account', 403, 'ROLE_NOT_ALLOWED');
  }

  await otpService.verifyOtp(mobile, otp, 'login');
  assertLoginableStatus(user);

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = issueTokens(user);
  return { user: toSafeUser(user), ...tokens };
}

export async function loginAdmin(loginId, password) {
  const user = await User.findOne({ where: { loginId, role: ROLES.ADMIN } });
  if (!user) throw new AppError('Invalid login credentials', 401, 'INVALID_CREDENTIALS');

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) throw new AppError('Invalid login credentials', 401, 'INVALID_CREDENTIALS');

  assertLoginableStatus(user);

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = issueTokens(user);
  return { user: toSafeUser(user), ...tokens };
}

export async function loginEmployee(employeeId, password) {
  const user = await User.findOne({ where: { memberId: employeeId, role: ROLES.EMPLOYEE } });
  if (!user) throw new AppError('Invalid login credentials', 401, 'INVALID_CREDENTIALS');

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) throw new AppError('Invalid login credentials', 401, 'INVALID_CREDENTIALS');

  assertLoginableStatus(user);

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = issueTokens(user);
  return { user: toSafeUser(user), ...tokens };
}

export async function refreshAccessToken(refreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401, 'INVALID_TOKEN');
  }
  const user = await User.findByPk(payload.id);
  if (!user) throw new AppError('User not found', 401, 'USER_NOT_FOUND');
  assertLoginableStatus(user);

  const tokens = issueTokens(user);
  return { user: toSafeUser(user), ...tokens };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function resetEmployeePassword(employeeId, newPassword) {
  const conditions = [
    { memberId: employeeId },
    { mobile: employeeId },
    { email: employeeId },
  ];
  if (UUID_REGEX.test(employeeId)) {
    conditions.push({ id: employeeId });
  }

  const user = await User.findOne({
    where: {
      role: ROLES.EMPLOYEE,
      [Op.or]: conditions,
    },
  });

  if (!user) {
    throw new AppError('Employee account not found', 404, 'USER_NOT_FOUND');
  }

  user.passwordHash = await hashPassword(newPassword);
  // Keep tempPassword in sync so the admin panel surfaces the new password
  // after an employee resets it from the login page.
  user.tempPassword = newPassword;
  await user.save();
  return { success: true };
}

export async function resetAdminPassword(adminId, newPassword) {
  const conditions = [
    { loginId: adminId },
    { memberId: adminId },
    { mobile: adminId },
    { email: adminId },
  ];
  if (UUID_REGEX.test(adminId)) {
    conditions.push({ id: adminId });
  }

  const user = await User.findOne({
    where: {
      role: ROLES.ADMIN,
      [Op.or]: conditions,
    },
  });

  if (!user) {
    throw new AppError('Admin account not found', 404, 'USER_NOT_FOUND');
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  return { success: true };
}
