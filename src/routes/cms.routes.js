import { Router } from 'express';
import * as controller from '../controllers/cms.controller.js';
import auth from '../middleware/auth.js';
import { requireRole } from '../middleware/permission.js';
import { ROLES } from '../constants/roles.js';

const router = Router();
router.get('/', controller.getCms);
export default router;

export const adminRouter = Router();
adminRouter.patch('/', auth, requireRole(ROLES.ADMIN), controller.updateCms);
