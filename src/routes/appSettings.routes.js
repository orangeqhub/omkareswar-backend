import { Router } from 'express';
import * as controller from '../controllers/appSettings.controller.js';
import auth from '../middleware/auth.js';
import { requireRole } from '../middleware/permission.js';
import { requirePermission } from '../middleware/permission.js';
import { ROLES } from '../constants/roles.js';
import { PERMISSIONS } from '../constants/permissions.js';

// Mounted at /api/admin/settings. Only admin may view/edit (ADMIN_SETTINGS_VIEW is never assignable to employees).
const router = Router();
router.get('/', auth, requireRole(ROLES.ADMIN), requirePermission(PERMISSIONS.ADMIN_SETTINGS_VIEW), controller.getSettings);
router.patch('/', auth, requireRole(ROLES.ADMIN), controller.updateSettings);

export default router;
