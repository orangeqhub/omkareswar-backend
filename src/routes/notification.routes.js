import { Router } from 'express';
import { param } from 'express-validator';
import * as controller from '../controllers/notification.controller.js';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = Router();
router.use(auth);

router.get('/me', controller.listMine);
router.patch('/read-all', controller.markAllRead);
router.patch('/:id/read', param('id').isUUID().withMessage('Invalid id'), validate, controller.markRead);

export default router;
