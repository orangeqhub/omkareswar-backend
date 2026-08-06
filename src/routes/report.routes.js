import { Router } from 'express';
import * as controller from '../controllers/report.controller.js';
import auth from '../middleware/auth.js';
import { requireRole, requirePermission } from '../middleware/permission.js';
import { ROLES } from '../constants/roles.js';
import { PERMISSIONS } from '../constants/permissions.js';

// Mounted at /api/admin/reports
const router = Router();
router.use(auth, requireRole(ROLES.ADMIN, ROLES.EMPLOYEE), requirePermission(PERMISSIONS.REPORTS_VIEW));

router.get('/users.xlsx', controller.users);
router.get('/properties.xlsx', controller.properties);
router.get('/enquiries.xlsx', controller.enquiries);
router.get('/visits.xlsx', controller.visits);
router.get('/follow-ups.xlsx', controller.followUps);
router.get('/commissions.xlsx', controller.commissions);

export default router;
