import { body, query } from 'express-validator';

export const createLeadValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 255 }).withMessage('Name is too long'),
  body('contact').trim().notEmpty().withMessage('Contact number is required').matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit mobile number'),
  body('cityVillage').trim().notEmpty().withMessage('City / village is required').isLength({ max: 150 }).withMessage('City / village is too long'),
  body('role').trim().notEmpty().withMessage('Role is required').isIn(['buyer', 'seller', 'mediator']).withMessage('Role must be buyer, seller or mediator'),
];

export const listLeadsValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('pageSize').optional().isInt({ min: 1, max: 200 }).withMessage('Page size must be between 1 and 200'),
];