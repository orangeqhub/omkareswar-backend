import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isUUID().withMessage('Invalid follow-up id')];

export const createValidator = [
  body('recordType').isIn(['enquiry', 'userVerification', 'property', 'visit']).withMessage('Invalid recordType'),
  body('recordId').isUUID().withMessage('Invalid recordId'),
  body('assignedEmployeeId').isUUID().withMessage('Invalid assignedEmployeeId'),
  body('dueDate').isISO8601().withMessage('Invalid dueDate'),
  body('priority').optional().isIn(['low', 'medium', 'high']),
];

export const rescheduleValidator = [
  param('id').isUUID(),
  body('dueDate').isISO8601().withMessage('Invalid dueDate'),
];

export const assignValidator = [
  param('id').isUUID(),
  body('assignedEmployeeId').isUUID().withMessage('Invalid assignedEmployeeId'),
];
