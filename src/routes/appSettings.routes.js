import { Router } from 'express';
import * as controller from '../controllers/appSettings.controller.js';
import auth from '../middleware/auth.js';
import { requireRole, requireManagerPermission } from '../middleware/permission.js';
import { ROLES } from '../constants/roles.js';
import { PERMISSIONS } from '../constants/permissions.js';

// Mounted at /api/admin/settings. Admin may always view/edit. Managers may do so
// only when they hold one of the settings-backed tab permissions (Settings,
// Locations or Property Fields — those three screens all live on this endpoint).
const managerSettingsGuard = requireManagerPermission(
  PERMISSIONS.MANAGER_SETTINGS_VIEW,
  PERMISSIONS.MANAGER_LOCATIONS_VIEW,
  PERMISSIONS.MANAGER_PROPERTY_FIELDS_VIEW
);

const router = Router();
router.get('/public', controller.getPublicSettings);
router.get('/', auth, requireRole(ROLES.ADMIN, ROLES.MANAGER), managerSettingsGuard, controller.getSettings);
router.patch('/', auth, requireRole(ROLES.ADMIN, ROLES.MANAGER), managerSettingsGuard, controller.updateSettings);

export default router;
