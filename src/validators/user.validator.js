import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isUUID().withMessage('Invalid id')];

export const updateStatusValidator = [
  param('id').isUUID().withMessage('Invalid id'),
  body('status')
    .isIn(['pending', 'approved', 'rejected', 'correction_requested', 'active', 'inactive'])
    .withMessage('Invalid status'),
];

// Field-level validation happens dynamically in registrationForm.service.js based
// on the admin-configured EMPLOYEE form. This validator only sanity-checks the
// fixed envelope fields.
export const createEmployeeValidator = [
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Enter a valid email'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array'),
  body('customFields').optional({ checkFalsy: true }).isObject().withMessage('customFields must be an object'),
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

export const assignEmployeeValidator = [
  param('id').isUUID().withMessage('Invalid id'),
  body('employeeId').optional({ checkFalsy: true }).isUUID().withMessage('Invalid employee id'),
  body('reason').optional().trim(),
];

export const changePasswordValidator = [
  body('currentPassword').isString().notEmpty().withMessage('Current password is required'),
  body('newPassword').isString().isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];
