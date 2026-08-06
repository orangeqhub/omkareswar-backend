import { Router } from 'express';
import * as controller from '../controllers/upload.controller.js';
import auth from '../middleware/auth.js';
import { uploadProfile, uploadPropertyImage, uploadDocument, uploadCms } from '../middleware/upload.js';

const router = Router();
router.use(auth);

router.post('/profile', uploadProfile, controller.uploadProfile);
router.post('/identity-proof', uploadDocument, controller.uploadIdentityProof);
router.post('/property-image', uploadPropertyImage, controller.uploadPropertyImage);
router.post('/property-document', uploadDocument, controller.uploadPropertyDocument);
router.post('/cms-image', uploadCms, controller.uploadCmsImage);
router.delete('/:id(.*)', controller.remove);

export default router;
