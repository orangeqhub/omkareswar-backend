import { body, param, query } from 'express-validator';

export const registerValidator = [
  body('role').isIn(['buyer', 'seller', 'mediator']).withMessage('Invalid role'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('mobile').trim().matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10 digit mobile number'),
  body('altMobile').optional({ checkFalsy: true }).trim(),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('district').trim().notEmpty().withMessage('District is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
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
