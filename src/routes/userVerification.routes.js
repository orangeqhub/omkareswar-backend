import { Router } from 'express';
import { body, param } from 'express-validator';
import * as controller from '../controllers/userVerification.controller.js';
import auth from '../middleware/auth.js';
import { requireRole, requirePermission } from '../middleware/permission.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';
import { PERMISSIONS } from '../constants/permissions.js';

const idParam = [param('userId').isUUID().withMessage('Invalid user id')];

// Mounted at /api/employee/user-verification
const router = Router();
router.use(auth, requireRole(ROLES.EMPLOYEE, ROLES.ADMIN));

router.get('/', requirePermission(PERMISSIONS.USER_VERIFICATION_VIEW), controller.list);
router.get('/:userId', requirePermission(PERMISSIONS.USER_VERIFICATION_VIEW), idParam, validate, controller.getOne);
router.post('/:userId/start-review', requirePermission(PERMISSIONS.USER_VERIFICATION_VIEW), idParam, validate, controller.startReview);
router.post(
  '/:userId/correction-request',
  requirePermission(PERMISSIONS.USER_VERIFICATION_CORRECTION_REQUEST),
  idParam,
  body('reason').trim().notEmpty().withMessage('Reason is required'),
  body('fields').optional().isArray(),
  validate,
  controller.correctionRequest
);
router.post(
  '/:userId/recommend-approval',
  requirePermission(PERMISSIONS.USER_VERIFICATION_RECOMMEND),
  idParam,
  validate,
  controller.recommendApproval
);
router.post(
  '/:userId/recommend-rejection',
  requirePermission(PERMISSIONS.USER_VERIFICATION_RECOMMEND),
  idParam,
  validate,
  controller.recommendRejection
);
router.post('/:userId/complete', requirePermission(PERMISSIONS.USER_VERIFICATION_VIEW), idParam, validate, controller.complete);

export default router;
