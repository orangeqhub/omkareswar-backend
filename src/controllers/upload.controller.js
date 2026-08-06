import fs from 'fs';
import path from 'path';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';
import { publicUrlFor } from '../middleware/upload.js';
import { User } from '../models/index.js';

export const uploadProfile = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400, 'NO_FILE');
  const url = publicUrlFor('profiles', req.file.filename);

  const user = await User.findByPk(req.user.id);
  user.profileImage = url;
  await user.save();

  sendSuccess(res, { message: 'Profile image uploaded', data: { url }, statusCode: 201 });
});

export const uploadIdentityProof = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400, 'NO_FILE');
  const url = publicUrlFor('documents', req.file.filename);
  sendSuccess(res, { message: 'Identity proof uploaded', data: { url, originalName: req.file.originalname }, statusCode: 201 });
});

export const uploadPropertyImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400, 'NO_FILE');
  const url = publicUrlFor('properties', req.file.filename);
  sendSuccess(res, { message: 'Property image uploaded', data: { url, slotId: req.body.slotId || null }, statusCode: 201 });
});

export const uploadPropertyDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400, 'NO_FILE');
  const url = publicUrlFor('documents', req.file.filename);
  sendSuccess(res, {
    message: 'Property document uploaded',
    data: { url, type: req.body.type || 'ownership_proof', originalName: req.file.originalname },
    statusCode: 201,
  });
});

export const uploadCmsImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400, 'NO_FILE');
  const url = publicUrlFor('cms', req.file.filename);
  sendSuccess(res, { message: 'CMS image uploaded', data: { url }, statusCode: 201 });
});

// DELETE /api/uploads/:id  where :id is the URL-encoded relative path returned
// by one of the upload endpoints above, e.g. /uploads/properties/<uuid>.jpg
export const remove = asyncHandler(async (req, res) => {
  const relativeUrl = decodeURIComponent(req.params.id);
  if (!relativeUrl.startsWith('/uploads/')) {
    throw new AppError('Invalid file reference', 400, 'INVALID_FILE');
  }
  const filePath = path.resolve('.' + relativeUrl);
  const uploadsRoot = path.resolve('uploads');
  if (!filePath.startsWith(uploadsRoot)) {
    throw new AppError('Invalid file reference', 400, 'INVALID_FILE');
  }
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  sendSuccess(res, { message: 'File deleted', data: null });
});
