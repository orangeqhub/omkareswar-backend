import { body, param } from 'express-validator';

export const enquiryIdParamValidator = [param('id').isUUID().withMessage('Invalid enquiry id')];
export const idParamValidator = [param('id').isUUID().withMessage('Invalid call note id')];

export const createCallNoteValidator = [
  param('id').isUUID(),
  body('callDateTime').isISO8601().withMessage('Invalid call date/time'),
  body('direction').isIn(['incoming', 'outgoing']).withMessage('Invalid direction'),
  body('interestLevel').optional().isIn(['low', 'medium', 'high']),
];
