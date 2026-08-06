import { OtpCode } from '../models/index.js';
import AppError from '../utils/AppError.js';

function generateCode() {
  if (process.env.OTP_MODE === 'demo') {
    return process.env.DEMO_OTP || '1234';
  }
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function requestOtp(mobile, purpose = 'login') {
  const code = generateCode();
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  await OtpCode.create({ mobile, code, purpose, expiresAt, consumed: false });

  // In demo mode we don't actually send an SMS; the OTP is fixed and known.
  return { mobile, expiresInMinutes: expiryMinutes, ...(process.env.OTP_MODE === 'demo' ? { demoOtp: code } : {}) };
}

export async function verifyOtp(mobile, code, purpose = 'login') {
  const otp = await OtpCode.findOne({
    where: { mobile, purpose, consumed: false },
    order: [['createdAt', 'DESC']],
  });

  if (!otp) {
    throw new AppError('OTP not found, please request a new one', 400, 'INVALID_OTP');
  }
  if (otp.expiresAt < new Date()) {
    throw new AppError('OTP has expired, please request a new one', 400, 'OTP_EXPIRED');
  }
  if (otp.code !== String(code)) {
    throw new AppError('Invalid OTP', 400, 'INVALID_OTP');
  }

  otp.consumed = true;
  await otp.save();
  return true;
}
