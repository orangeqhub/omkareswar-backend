import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';
import auth from '../middleware/auth.js';
import { requireRole } from '../middleware/permission.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';
import { slugParamValidator, createCategoryValidator, reorderValidator } from '../validators/category.validator.js';

const router = Router();

router.get('/', categoryController.listPublic);
router.get('/:slug/in-use', slugParamValidator, validate, categoryController.inUse);

export default router;

// Mounted at /api/admin/categories
export const adminRouter = Router();
adminRouter.get('/', auth, requireRole(ROLES.ADMIN), categoryController.listAll);
adminRouter.get('/:slug', auth, requireRole(ROLES.ADMIN), slugParamValidator, validate, categoryController.getOne);
adminRouter.post('/', auth, requireRole(ROLES.ADMIN), createCategoryValidator, validate, categoryController.create);
adminRouter.patch('/:slug', auth, requireRole(ROLES.ADMIN), slugParamValidator, validate, categoryController.update);
adminRouter.delete('/:slug', auth, requireRole(ROLES.ADMIN), slugParamValidator, validate, categoryController.remove);
adminRouter.patch(
  '/:slug/reorder',
  auth,
  requireRole(ROLES.ADMIN),
  reorderValidator,
  validate,
  categoryController.reorder
);
