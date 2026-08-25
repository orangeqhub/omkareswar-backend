import { randomInt } from 'crypto';
import { OtpCode } from '../models/index.js';
import AppError from '../utils/AppError.js';

function generateCode() {
  if (process.env.OTP_MODE === 'demo') {
    return process.env.DEMO_OTP || '123456';
  }

  return String(randomInt(100000, 1000000));
}

function normalizeMobile(mobile) {
  const digits = String(mobile || '').replace(/\D/g, '');

  if (/^[6-9]\d{9}$/.test(digits)) {
    return `91${digits}`;
  }

  if (/^91[6-9]\d{9}$/.test(digits)) {
    return digits;
  }

  throw new AppError(
    'Invalid mobile number',
    400,
    'INVALID_MOBILE'
  );
}

function buildOtpMessage(code, expiryMinutes) {
  const template =
    process.env.COMBIRDS_OTP_MESSAGE ||
    'Dear User, your OTP for Omkareswar Realtors verification is {OTP}. This OTP is valid for {MINUTES} minutes. Do not share this OTP with anyone.';

  return template
    .replace(/\{OTP\}/g, code)
    .replace(/\{MINUTES\}/g, String(expiryMinutes));
}

async function sendOtpSms(mobile, code, expiryMinutes) {
  const apiUrl =
    process.env.COMBIRDS_API_URL ||
    'https://smsapi.edumarcsms.com/api/v1/sendsms';

  const apiKey = process.env.COMBIRDS_API_KEY;
  const senderId = process.env.COMBIRDS_SENDER_ID;
  const templateId = process.env.COMBIRDS_TEMPLATE_ID;

  if (!apiKey || !senderId || !templateId) {
    throw new AppError(
      'SMS configuration is incomplete',
      500,
      'SMS_CONFIG_ERROR'
    );
  }

  const number = normalizeMobile(mobile);
  const message = buildOtpMessage(code, expiryMinutes);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: apiKey,
    },
    body: JSON.stringify({
      number: [number],
      message,
      senderId,
      templateId,
    }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error(
      'Combirds SMS error:',
      response.status,
      responseText
    );

    throw new AppError(
      'Unable to send OTP SMS',
      502,
      'SMS_SEND_FAILED'
    );
  }

  console.log(
    `OTP SMS submitted successfully to ******${number.slice(-4)}`
  );

  return true;
}

export async function requestOtp(mobile, purpose = 'login') {
  const code = generateCode();

  const expiryMinutes = parseInt(
    process.env.OTP_EXPIRY_MINUTES || '10',
    10
  );

  const expiresAt = new Date(
    Date.now() + expiryMinutes * 60 * 1000
  );

  const otpRecord = await OtpCode.create({
    mobile,
    code,
    purpose,
    expiresAt,
    consumed: false,
  });

  try {
    if (process.env.OTP_MODE !== 'demo') {
      await sendOtpSms(mobile, code, expiryMinutes);
    }
  } catch (error) {
    await otpRecord.destroy();
    throw error;
  }

  return {
    mobile,
    expiresInMinutes: expiryMinutes,
    ...(process.env.OTP_MODE === 'demo'
      ? { demoOtp: code }
      : {}),
  };
}

export async function verifyOtp(
  mobile,
  code,
  purpose = 'login'
) {
  const otp = await OtpCode.findOne({
    where: {
      mobile,
      purpose,
      consumed: false,
    },
    order: [['createdAt', 'DESC']],
  });

  if (!otp) {
    throw new AppError(
      'OTP not found, please request a new one',
      400,
      'INVALID_OTP'
    );
  }

  if (otp.expiresAt < new Date()) {
    throw new AppError(
      'OTP has expired, please request a new one',
      400,
      'OTP_EXPIRED'
    );
  }

  if (otp.code !== String(code)) {
    throw new AppError(
      'Invalid OTP',
      400,
      'INVALID_OTP'
    );
  }

  otp.consumed = true;
  await otp.save();

  return true;
}