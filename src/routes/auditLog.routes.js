import { Router } from 'express';
import * as controller from '../controllers/auditLog.controller.js';
import auth from '../middleware/auth.js';
import { requireRole } from '../middleware/permission.js';
import { ROLES } from '../constants/roles.js';

const router = Router();
router.get('/', auth, requireRole(ROLES.ADMIN), controller.list);

export default router;
