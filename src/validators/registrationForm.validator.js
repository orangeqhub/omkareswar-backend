import { body, param } from 'express-validator';
import { FORM_TYPES_LIST } from '../constants/registrationForms.js';

export const formTypeParamValidator = [param('formType').isIn(FORM_TYPES_LIST).withMessage('Invalid form type')];

export const fieldIdParamValidator = [param('fieldId').isUUID().withMessage('Invalid field id')];

export const createFieldValidator = [
  body('fieldKey').trim().notEmpty().withMessage('Field key is required'),
  body('label').trim().notEmpty().withMessage('Label is required'),
  body('fieldType').trim().notEmpty().withMessage('Field type is required'),
  body('placeholder').optional({ checkFalsy: true }).trim(),
  body('helpText').optional({ checkFalsy: true }),
  body('isRequired').optional().isBoolean().withMessage('isRequired must be a boolean'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('options').optional().isArray().withMessage('Options must be an array'),
  body('validation').optional().isObject().withMessage('Validation must be an object'),
];

export const updateFieldValidator = [
  body('fieldKey').optional({ checkFalsy: true }).trim().notEmpty().withMessage('Field key cannot be empty'),
  body('label').optional({ checkFalsy: true }).trim().notEmpty().withMessage('Label cannot be empty'),
  body('fieldType').optional({ checkFalsy: true }).trim().notEmpty().withMessage('Field type cannot be empty'),
  body('placeholder').optional({ checkFalsy: true }).trim(),
  body('helpText').optional({ checkFalsy: true }),
  body('isRequired').optional().isBoolean().withMessage('isRequired must be a boolean'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('options').optional().isArray().withMessage('Options must be an array'),
  body('validation').optional().isObject().withMessage('Validation must be an object'),
];

export const reorderValidator = [
  body('order').isArray().withMessage('Order must be an array of field keys'),
  body('order.*').isString().withMessage('Order items must be field keys'),
];

export const updateFormMetaValidator = [
  body('name').optional({ checkFalsy: true }).trim().notEmpty().withMessage('Form name cannot be empty'),
  body('description').optional(),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];
