import { Router } from 'express';
import * as mediaRuleController from '../controllers/mediaRule.controller.js';
import auth from '../middleware/auth.js';
import { requireRole, requireManagerPermission } from '../middleware/permission.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';
import { PERMISSIONS } from '../constants/permissions.js';
import {
  ruleKeyParamValidator,
  commonSlotValidator,
  extraSpaceValidator,
} from '../validators/mediaRule.validator.js';

// Public (authenticated) lookup used by the property wizard
const router = Router();
router.get('/', auth, mediaRuleController.listAll);
router.get('/:ruleKey', auth, ruleKeyParamValidator, validate, mediaRuleController.getOne);
export default router;

const managerMediaRulesGuard = requireManagerPermission(PERMISSIONS.MANAGER_MEDIA_RULES_VIEW);

// Mounted at /api/admin/media-rules
export const adminRouter = Router();
adminRouter.get('/', auth, requireRole(ROLES.ADMIN, ROLES.MANAGER), managerMediaRulesGuard, mediaRuleController.listAll);
adminRouter.patch('/:ruleKey', auth, requireRole(ROLES.ADMIN, ROLES.MANAGER), managerMediaRulesGuard, ruleKeyParamValidator, validate, mediaRuleController.update);
adminRouter.post(
  '/:ruleKey/restore-defaults',
  auth,
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  managerMediaRulesGuard,
  ruleKeyParamValidator,
  validate,
  mediaRuleController.restoreDefaults
);
adminRouter.post(
  '/:ruleKey/common-slots',
  auth,
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  managerMediaRulesGuard,
  commonSlotValidator,
  validate,
  mediaRuleController.addCommonSlot
);
adminRouter.patch(
  '/:ruleKey/common-slots/:slotId',
  auth,
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  managerMediaRulesGuard,
  ruleKeyParamValidator,
  validate,
  mediaRuleController.updateCommonSlot
);
adminRouter.delete(
  '/:ruleKey/common-slots/:slotId',
  auth,
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  managerMediaRulesGuard,
  ruleKeyParamValidator,
  validate,
  mediaRuleController.deleteCommonSlot
);
adminRouter.post(
  '/:ruleKey/extra-spaces',
  auth,
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  managerMediaRulesGuard,
  extraSpaceValidator,
  validate,
  mediaRuleController.addExtraSpace
);
adminRouter.delete(
  '/:ruleKey/extra-spaces/:key',
  auth,
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  managerMediaRulesGuard,
  ruleKeyParamValidator,
  validate,
  mediaRuleController.deleteExtraSpace
);
