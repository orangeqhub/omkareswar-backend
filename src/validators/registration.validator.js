import { body, param, query } from 'express-validator';

// Field-level validation happens dynamically in registrationForm.service.js based
// on the admin-configured form for each role. This validator only sanity-checks
// the fixed envelope fields.
export const registerValidator = [
  body('role').isIn(['buyer', 'seller', 'mediator', 'employee']).withMessage('Invalid role'),
  body('customFields').optional({ checkFalsy: true }).isObject().withMessage('customFields must be an object'),
];

export const statusQueryValidator = [query('mobile').trim().matches(/^[6-9]\d{9}$/).withMessage('Enter a valid mobile number')];

export const assignEmployeeValidator = [
  param('id').isUUID().withMessage('Invalid registration id'),
  body('employeeId').isUUID().withMessage('Invalid employee id'),
];

export const rejectValidator = [
  param('id').isUUID().withMessage('Invalid registration id'),
  body('reason').trim().notEmpty().withMessage('Reason is required'),
];

export const correctionValidator = [
  param('id').isUUID().withMessage('Invalid registration id'),
  body('reason').trim().notEmpty().withMessage('Reason is required'),
  body('fields').optional().isArray().withMessage('Fields must be an array'),
];

export const idParamValidator = [param('id').isUUID().withMessage('Invalid id')];
