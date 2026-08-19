import { Router } from 'express';
import * as controller from '../controllers/registrationForm.controller.js';
import auth from '../middleware/auth.js';
import { requireRole } from '../middleware/permission.js';
import validate from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';
import {
  formTypeParamValidator,
  fieldIdParamValidator,
  createFieldValidator,
  updateFieldValidator,
  reorderValidator,
  updateFormMetaValidator,
} from '../validators/registrationForm.validator.js';

const router = Router();

// Public: used by the register pages before a token exists.
router.get('/:formType', formTypeParamValidator, validate, controller.getPublicForm);

export default router;

// Admin-only config endpoints.
export const adminRouter = Router();
adminRouter.use(auth);
adminRouter.use(requireRole(ROLES.ADMIN));

adminRouter.get('/', controller.listForms);
adminRouter.get('/:formType', formTypeParamValidator, validate, controller.getForm);
adminRouter.patch('/:formType', [...formTypeParamValidator, ...updateFormMetaValidator], validate, controller.updateFormMeta);
adminRouter.post('/:formType/fields', [...formTypeParamValidator, ...createFieldValidator], validate, controller.createField);
adminRouter.patch('/:formType/fields/reorder', [...formTypeParamValidator, ...reorderValidator], validate, controller.reorderFields);
adminRouter.patch('/:formType/fields/:fieldId', [...formTypeParamValidator, ...fieldIdParamValidator, ...updateFieldValidator], validate, controller.updateField);
adminRouter.delete('/:formType/fields/:fieldId', [...formTypeParamValidator, ...fieldIdParamValidator], validate, controller.deleteField);
