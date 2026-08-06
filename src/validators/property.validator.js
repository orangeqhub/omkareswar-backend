import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isUUID().withMessage('Invalid property id')];

export const createDraftValidator = [
  body('categorySlug').trim().notEmpty().withMessage('categorySlug is required'),
];

export const moderateValidator = [
  param('id').isUUID().withMessage('Invalid property id'),
  body('action').isIn(['approve', 'reject', 'requestChanges']).withMessage('Invalid action'),
];

export const assignValidator = [
  param('id').isUUID().withMessage('Invalid property id'),
  body('assignedEmployeeId').optional({ nullable: true }).isUUID(),
  body('assignedMediatorId').optional({ nullable: true }).isUUID(),
];
