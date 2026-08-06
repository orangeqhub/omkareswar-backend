import { Router } from 'express';
import { body, param } from 'express-validator';
import * as propertyService from '../services/property.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';

// Convenience routes bound to the logged-in user: /api/favourites
const router = Router();
router.use(auth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const data = await propertyService.listFavourites(req.user.id);
    sendSuccess(res, { message: 'Favourites fetched', data });
  })
);

router.post(
  '/',
  body('propertyId').isUUID().withMessage('Invalid property id'),
  validate,
  asyncHandler(async (req, res) => {
    const data = await propertyService.toggleFavourite(req.user.id, req.body.propertyId);
    sendSuccess(res, { message: 'Favourite added', data, statusCode: 201 });
  })
);

router.delete(
  '/:propertyId',
  param('propertyId').isUUID().withMessage('Invalid property id'),
  validate,
  asyncHandler(async (req, res) => {
    const data = await propertyService.toggleFavourite(req.user.id, req.params.propertyId);
    sendSuccess(res, { message: 'Favourite removed', data });
  })
);

export default router;
