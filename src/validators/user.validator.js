import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isUUID().withMessage('Invalid id')];

export const updateStatusValidator = [
  param('id').isUUID().withMessage('Invalid id'),
  body('status')
    .isIn(['pending', 'approved', 'rejected', 'correction_requested', 'active', 'inactive'])
    .withMessage('Invalid status'),
];

export const createEmployeeValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('mobile').trim().matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10 digit mobile number'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Enter a valid email'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array'),
];

export const updatePermissionsValidator = [
  param('id').isUUID().withMessage('Invalid id'),
  body('permissions').isArray().withMessage('Permissions must be an array'),
];

export const updateEmployeeStatusValidator = [
  param('id').isUUID().withMessage('Invalid id'),
  body('status').isIn(['active', 'inactive']).withMessage('Invalid status'),
];

export const assignMediatorValidator = [
  param('id').isUUID().withMessage('Invalid id'),
  body('mediatorId').isUUID().withMessage('Invalid mediator id'),
];
