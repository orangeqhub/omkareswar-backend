import { Router } from 'express';
import * as propertyController from '../controllers/property.controller.js';
import auth from '../middleware/auth.js';
import optionalAuth from '../middleware/optionalAuth.js';
import { requireRole, requirePermission } from '../middleware/permission.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';
import { PERMISSIONS } from '../constants/permissions.js';
import { idParamValidator, createDraftValidator, moderateValidator, assignValidator } from '../validators/property.validator.js';

// ---- /api/properties ----
const router = Router();
router.get('/', propertyController.list);
router.get('/featured', propertyController.featured);
router.get('/latest', propertyController.latest);
router.post('/drafts', auth, requireRole(ROLES.SELLER, ROLES.BUYER, ROLES.MEDIATOR, ROLES.ADMIN, ROLES.EMPLOYEE), createDraftValidator, validate, propertyController.createDraft);
router.get('/:id', idParamValidator, validate, propertyController.getOne);
router.get('/:id/related', idParamValidator, validate, propertyController.related);
router.post('/:id/view', optionalAuth, idParamValidator, validate, propertyController.recordView);
router.post('/:id/submit', auth, requireRole(ROLES.SELLER, ROLES.BUYER, ROLES.MEDIATOR, ROLES.ADMIN, ROLES.EMPLOYEE), idParamValidator, validate, propertyController.submit);
router.patch('/:id', auth, idParamValidator, validate, propertyController.update);
router.delete('/:id', auth, idParamValidator, validate, propertyController.remove);
router.patch('/:id/assign', auth, requireRole(ROLES.ADMIN), assignValidator, validate, propertyController.assign);
export default router;

// ---- /api/sellers/:sellerId/properties ----
export const sellerRouter = Router();
sellerRouter.get('/:sellerId/properties', auth, propertyController.sellerProperties);

// ---- /api/users/:userId/favourites ----
export const favouriteRouter = Router();
favouriteRouter.get('/:userId/favourites', auth, propertyController.listFavourites);
favouriteRouter.get('/:userId/favourites/ids', auth, propertyController.listFavouriteIds);
favouriteRouter.post('/:userId/favourites/:propertyId/toggle', auth, propertyController.toggleFavourite);

// ---- /api/me/properties ----
export const meRouter = Router();
meRouter.get('/properties', auth, requireRole(ROLES.SELLER, ROLES.BUYER, ROLES.MEDIATOR), propertyController.myProperties);

// ---- /api/mediator/properties ----
export const mediatorRouter = Router();
mediatorRouter.get('/properties', auth, requireRole(ROLES.MEDIATOR), propertyController.mediatorProperties);

// ---- /api/employee/properties ----
export const employeeRouter = Router();
employeeRouter.get(
  '/properties',
  auth,
  requireRole(ROLES.EMPLOYEE),
  requirePermission(PERMISSIONS.PROPERTY_MODERATION_VIEW),
  propertyController.employeeProperties
);

// ---- /api/admin/properties ----
export const adminRouter = Router();
adminRouter.get('/', auth, requireRole(ROLES.ADMIN), propertyController.adminProperties);
adminRouter.post('/:id/moderate', auth, requireRole(ROLES.ADMIN), moderateValidator, validate, propertyController.moderate);
adminRouter.patch('/:id/approve', auth, requireRole(ROLES.ADMIN), idParamValidator, validate, propertyController.approve);
adminRouter.patch('/:id/reject', auth, requireRole(ROLES.ADMIN), idParamValidator, validate, propertyController.reject);
adminRouter.patch(
  '/:id/request-changes',
  auth,
  requireRole(ROLES.ADMIN),
  idParamValidator,
  validate,
  propertyController.requestChanges
);
adminRouter.patch(
  '/:id/assign-employee',
  auth,
  requireRole(ROLES.ADMIN),
  idParamValidator,
  validate,
  propertyController.assignEmployee
);
adminRouter.patch(
  '/:id/assign-mediator',
  auth,
  requireRole(ROLES.ADMIN),
  idParamValidator,
  validate,
  propertyController.assignMediator
);
adminRouter.patch('/:id/feature', auth, requireRole(ROLES.ADMIN), idParamValidator, validate, propertyController.feature);
adminRouter.patch('/:id/verify', auth, requireRole(ROLES.ADMIN), idParamValidator, validate, propertyController.verify);
adminRouter.patch('/:id/mark-sold', auth, requireRole(ROLES.ADMIN), idParamValidator, validate, propertyController.markSold);
