import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import AppError from '../utils/AppError.js';

const UPLOAD_ROOT = path.resolve('uploads');

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.jfif', '.heic', '.heif', '.gif', '.svg'];
const DOCUMENT_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

function storageFor(subfolder) {
  const dir = path.join(UPLOAD_ROOT, subfolder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    },
  });
}

function fileFilterFor(allowedExtensions) {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return cb(new AppError(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`, 400, 'INVALID_FILE_TYPE'));
    }
    cb(null, true);
  };
}

function maxSizeBytes() {
  const mb = parseFloat(process.env.MAX_IMAGE_SIZE_MB || '30');
  return mb * 1024 * 1024;
}

export const uploadProfile = multer({
  storage: storageFor('profiles'),
  fileFilter: fileFilterFor(IMAGE_EXTENSIONS),
  limits: { fileSize: maxSizeBytes() },
}).single('file');

export const uploadPropertyImage = multer({
  storage: storageFor('properties'),
  fileFilter: fileFilterFor(IMAGE_EXTENSIONS),
  limits: { fileSize: maxSizeBytes() },
}).single('file');

export const uploadDocument = multer({
  storage: storageFor('documents'),
  fileFilter: fileFilterFor(DOCUMENT_EXTENSIONS),
  limits: { fileSize: maxSizeBytes() },
}).single('file');

export const uploadCms = multer({
  storage: storageFor('cms'),
  fileFilter: fileFilterFor(IMAGE_EXTENSIONS),
  limits: { fileSize: maxSizeBytes() },
}).single('file');

export function publicUrlFor(subfolder, filename) {
  const base = process.env.NODE_ENV === 'test' ? '/uploads' : (process.env.UPLOAD_BASE_URL || '/uploads');
  return `${base}/${subfolder}/${filename}`;
}
