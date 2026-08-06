import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as controller from '../controllers/internalNote.controller.js';
import auth from '../middleware/auth.js';
import { requireRole, requirePermission } from '../middleware/permission.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';
import { PERMISSIONS } from '../constants/permissions.js';

const router = Router();
router.use(auth, requireRole(ROLES.ADMIN, ROLES.EMPLOYEE));

router.get(
  '/',
  requirePermission(PERMISSIONS.INTERNAL_NOTES_VIEW),
  query('recordType').trim().notEmpty(),
  query('recordId').isUUID(),
  validate,
  controller.list
);
router.post(
  '/',
  requirePermission(PERMISSIONS.INTERNAL_NOTES_MANAGE),
  body('recordType').trim().notEmpty(),
  body('recordId').isUUID(),
  body('text').trim().notEmpty().withMessage('Text is required'),
  validate,
  controller.create
);
router.patch('/:id', param('id').isUUID(), body('text').trim().notEmpty(), validate, controller.update);
router.delete('/:id', param('id').isUUID(), validate, controller.remove);

export default router;
