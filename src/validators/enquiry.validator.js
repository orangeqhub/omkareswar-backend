import { body, param } from 'express-validator';

/*
 * GET /api/enquiries/:id
 * PATCH /api/enquiries/:id/complete
 * Call notes routes
 */
export const idParamValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid enquiry id'),
];

/*
 * POST /api/enquiries
 *
 * Property enquiry:
 * propertyId untundi.
 *
 * Contact-page enquiry:
 * propertyId, sellerId, buyerId null ga undachu.
 */
export const createEnquiryValidator = [
  body('propertyId')
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isUUID()
    .withMessage('Invalid property id'),

  body('sellerId')
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isUUID()
    .withMessage('Invalid seller id'),

  body('buyerId')
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isUUID()
    .withMessage('Invalid buyer id'),

  body('buyerName')
    .trim()
    .notEmpty()
    .withMessage('Buyer name is required')
    .isLength({ max: 255 })
    .withMessage('Buyer name cannot exceed 255 characters'),

  body('buyerPhone')
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Enter a valid mobile number'),

  body('message')
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Message cannot exceed 5000 characters'),

  body('channel')
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isIn([
      'whatsapp',
      'call',
      'contact',
      'interest',
      'email',
    ])
    .withMessage('Invalid channel'),
];

/*
 * PATCH /api/enquiries/:id/status
 */
export const statusValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid enquiry id'),

  body('status')
    .isIn([
      'new',
      'contacted',
      'followup_required',
      'visit_requested',
      'closed',
    ])
    .withMessage('Invalid status'),
];

/*
 * PATCH /api/enquiries/:id/priority
 */
export const priorityValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid enquiry id'),

  body('priority')
    .isIn([
      'low',
      'medium',
      'high',
    ])
    .withMessage('Invalid priority'),
];

/*
 * PATCH /api/enquiries/:id/next-follow-up
 */
export const nextFollowUpValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid enquiry id'),

  body('nextFollowUpAt')
    .isISO8601()
    .withMessage('Invalid date'),
];

/*
 * PATCH /api/admin/enquiries/:id/assign-employee
 * PATCH /api/admin/enquiries/:id/assign-mediator
 */
export const assignValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid enquiry id'),

  body('employeeId')
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isUUID()
    .withMessage('Invalid employee id'),

  body('mediatorId')
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isUUID()
    .withMessage('Invalid mediator id'),
];