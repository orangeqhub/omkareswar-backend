import { body, param } from 'express-validator';

export const ruleKeyParamValidator = [param('ruleKey').trim().notEmpty().withMessage('ruleKey is required')];

export const commonSlotValidator = [
  param('ruleKey').trim().notEmpty(),
  body('slotKey').trim().notEmpty().withMessage('slotKey is required'),
  body('labelEn').trim().notEmpty().withMessage('labelEn is required'),
];

export const extraSpaceValidator = [
  param('ruleKey').trim().notEmpty(),
  body('key').trim().notEmpty().withMessage('key is required'),
  body('labelEn').trim().notEmpty().withMessage('labelEn is required'),
];
