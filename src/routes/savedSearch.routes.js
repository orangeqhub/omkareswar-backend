import { Router } from 'express';
import { body, param } from 'express-validator';
import * as controller from '../controllers/savedSearch.controller.js';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = Router();
router.use(auth);

router.get('/', controller.list);
router.post('/', body('name').trim().notEmpty().withMessage('Name is required'), validate, controller.create);
router.delete('/:id', param('id').isUUID().withMessage('Invalid id'), validate, controller.remove);

export default router;
