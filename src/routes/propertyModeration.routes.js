import { Router } from 'express';
import { body, param } from 'express-validator';
import * as controller from '../controllers/propertyModeration.controller.js';
import auth from '../middleware/auth.js';
import { requireRole, requirePermission } from '../middleware/permission.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';
import { PERMISSIONS } from '../constants/permissions.js';

const idParam = [param('id').isUUID().withMessage('Invalid property id')];

// Mounted at /api/employee/property-moderation
const router = Router();
router.use(auth, requireRole(ROLES.EMPLOYEE, ROLES.ADMIN));

router.get('/', requirePermission(PERMISSIONS.PROPERTY_MODERATION_VIEW), controller.list);
router.get('/:id', requirePermission(PERMISSIONS.PROPERTY_MODERATION_VIEW), idParam, validate, controller.getOne);
router.post('/:id/start', requirePermission(PERMISSIONS.PROPERTY_MODERATION_VIEW), idParam, validate, controller.start);
router.post(
  '/:id/add-note',
  requirePermission(PERMISSIONS.PROPERTY_MODERATION_VIEW),
  idParam,
  body('note').trim().notEmpty().withMessage('Note is required'),
  validate,
  controller.addNote
);
router.post(
  '/:id/request-changes',
  requirePermission(PERMISSIONS.PROPERTY_MODERATION_CORRECTION_REQUEST),
  idParam,
  body('reason').trim().notEmpty().withMessage('Reason is required'),
  body('fields').optional().isArray(),
  body('slots').optional().isArray(),
  validate,
  controller.requestChanges
);
router.post(
  '/:id/recommend-approval',
  requirePermission(PERMISSIONS.PROPERTY_MODERATION_RECOMMEND),
  idParam,
  validate,
  controller.recommendApproval
);
router.post(
  '/:id/recommend-rejection',
  requirePermission(PERMISSIONS.PROPERTY_MODERATION_RECOMMEND),
  idParam,
  validate,
  controller.recommendRejection
);
router.post('/:id/complete', requirePermission(PERMISSIONS.PROPERTY_MODERATION_VIEW), idParam, validate, controller.complete);

export default router;
