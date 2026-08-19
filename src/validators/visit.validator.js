import { body, param } from 'express-validator';

export const idParamValidator = [param('id').isUUID().withMessage('Invalid visit id')];

export const createVisitValidator = [
  body('propertyId').isUUID().withMessage('Invalid property id'),
  body('buyerId').isUUID().withMessage('Invalid buyer id'),
  body('scheduledFor')
    .custom((value) => {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) throw new Error('Invalid scheduled date/time');
      return true;
    })
    .withMessage('Invalid scheduled date/time'),
];

export const rescheduleValidator = [
  param('id').isUUID(),
  body('scheduledFor')
    .custom((value) => {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) throw new Error('Invalid scheduled date/time');
      return true;
    })
    .withMessage('Invalid scheduled date/time'),
];

export const noteBodyValidator = [param('id').isUUID(), body('note').optional().trim()];

export const outcomeValidator = [param('id').isUUID(), body('outcome').trim().notEmpty().withMessage('Outcome is required')];

export const assignValidator = [
  param('id').isUUID(),
  body('assignedMediatorId').optional({ nullable: true }).isUUID(),
  body('assignedEmployeeId').optional({ nullable: true }).isUUID(),
];
