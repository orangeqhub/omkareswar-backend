import { body, query } from 'express-validator';

export const createLeadValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 255 }).withMessage('Name is too long'),
  body('contact').trim().notEmpty().withMessage('Contact number is required').matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit mobile number'),
];

export const listLeadsValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('pageSize').optional().isInt({ min: 1, max: 200 }).withMessage('Page size must be between 1 and 200'),
];