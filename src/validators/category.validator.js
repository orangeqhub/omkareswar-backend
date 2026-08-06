import { body, param } from 'express-validator';

export const slugParamValidator = [param('slug').trim().notEmpty().withMessage('Slug is required')];

export const createCategoryValidator = [
  body('slug').trim().notEmpty().withMessage('Slug is required'),
  body('ruleKey').trim().notEmpty().withMessage('ruleKey is required'),
  body('nameEn').trim().notEmpty().withMessage('nameEn is required'),
];

export const reorderValidator = [
  param('slug').trim().notEmpty().withMessage('Slug is required'),
  body('direction').isIn(['up', 'down']).withMessage('Direction must be up or down'),
];
