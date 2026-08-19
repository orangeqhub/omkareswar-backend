import { Op } from 'sequelize';
import { sequelize, RegistrationForm, RegistrationField } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { log as auditLog } from './auditLog.service.js';
import {
  ROLE_TO_FORM_TYPE,
  SYSTEM_FIELDS,
  SYSTEM_FIELD_KEYS,
  FORBIDDEN_KEYS,
  SUBMISSION_META_KEYS,
  ALLOWED_FIELD_TYPES,
  OPTION_FIELD_TYPES,
  DEFAULT_FORMS,
} from '../constants/registrationForms.js';

const KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;
const INDIAN_MOBILE = /^[6-9]\d{9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------------
// Seeding / lookup
// ---------------------------------------------------------------------------

/**
 * Creates the default form configs (if the table is empty). Idempotent - safe
 * to call on every startup. Mirrors appSettings.service auto-seeding behaviour.
 */
export async function ensureDefaultForms(transaction) {
  const count = await RegistrationForm.count({ transaction });
  if (count > 0) return { created: false, count };

  const created = await sequelize.transaction(async (t) => {
    for (const def of DEFAULT_FORMS) {
      const [form] = await RegistrationForm.findOrCreate({
        where: { formType: def.formType },
        defaults: { formType: def.formType, name: def.name, description: def.description },
        transaction: t,
      });

      const existing = await RegistrationField.count({ where: { registrationFormId: form.id }, transaction: t });
      if (existing > 0) continue;

      await RegistrationField.bulkCreate(
        def.fields.map((f) => ({
          registrationFormId: form.id,
          fieldKey: f.fieldKey,
          label: f.label,
          fieldType: f.fieldType,
          placeholder: f.placeholder || null,
          helpText: f.helpText || null,
          defaultValue: f.defaultValue ?? null,
          validationRules: f.validation || {},
          options: f.options || null,
          isRequired: !!f.isRequired,
          isActive: true,
          isSystemField: SYSTEM_FIELD_KEYS.has(f.fieldKey),
          displayOrder: f.displayOrder ?? 0,
        })),
        { transaction: t }
      );
    }
    return true;
  });

  return { created, count: created ? DEFAULT_FORMS.length : count };
}

async function findFormOrCreate(formType) {
  let form = await RegistrationForm.findOne({ where: { formType } });
  if (!form) {
    await ensureDefaultForms();
    form = await RegistrationForm.findOne({ where: { formType } });
  }
  if (!form) throw new AppError('Registration form not found', 404, 'FORM_NOT_FOUND');
  return form;
}

async function findFieldsForForm(formId, opts = {}) {
  const where = { registrationFormId: formId };
  if (opts.activeOnly) where.isActive = true;
  return RegistrationField.findAll({ where, order: [['displayOrder', 'ASC'], ['createdAt', 'ASC']] });
}

function normalizeOptions(options) {
  if (!Array.isArray(options) || options.length === 0) return null;
  return options.map((o) => {
    if (o && typeof o === 'object' && 'value' in o) {
      return { label: String(o.label ?? o.value), value: String(o.value) };
    }
    return { label: String(o), value: String(o) };
  });
}

function serializeField(field) {
  return {
    id: field.id,
    fieldKey: field.fieldKey,
    label: field.label,
    fieldType: field.fieldType,
    placeholder: field.placeholder,
    helpText: field.helpText,
    defaultValue: field.defaultValue,
    validation: field.validationRules || {},
    options: normalizeOptions(field.options),
    isRequired: field.isRequired,
    isActive: field.isActive,
    isSystemField: field.isSystemField,
    displayOrder: field.displayOrder,
  };
}

function serializeForm(form, fields) {
  return {
    id: form.id,
    formType: form.formType,
    name: form.name,
    description: form.description,
    isActive: form.isActive,
    fields: (fields || []).map(serializeField),
  };
}

// ---------------------------------------------------------------------------
// Public config (used by the register pages before a token exists)
// ---------------------------------------------------------------------------

export async function getPublicForm(formType) {
  const form = await findFormOrCreate(formType);
  const fields = await findFieldsForForm(form.id, { activeOnly: true });
  return serializeForm(form, fields);
}

// ---------------------------------------------------------------------------
// Admin config CRUD
// ---------------------------------------------------------------------------

export async function listForms() {
  const forms = await RegistrationForm.findAll({
    order: [['formType', 'ASC']],
    include: [{ model: RegistrationField, as: 'fields', separate: true, order: [['displayOrder', 'ASC']] }],
  });
  return forms.map((f) => serializeForm(f, f.fields || []));
}

export async function getFormAdmin(formType) {
  const form = await findFormOrCreate(formType);
  const fields = await findFieldsForForm(form.id);
  return serializeForm(form, fields);
}

function assertValidFieldDefinition({ fieldKey, label, fieldType, options }) {
  if (!fieldKey || !KEY_PATTERN.test(fieldKey)) {
    throw new AppError('Field key must start with a letter and contain only letters, numbers and underscores', 400, 'INVALID_FIELD_KEY');
  }
  if (fieldKey.length > 64) throw new AppError('Field key cannot exceed 64 characters', 400, 'INVALID_FIELD_KEY');
  if (FORBIDDEN_KEYS.has(fieldKey)) {
    throw new AppError(`"${fieldKey}" is a reserved key and cannot be used`, 400, 'RESERVED_FIELD_KEY');
  }
  if (!label || !String(label).trim()) throw new AppError('Label is required', 400, 'LABEL_REQUIRED');
  if (String(label).trim().length > 120) throw new AppError('Label cannot exceed 120 characters', 400, 'INVALID_LABEL');
  if (!ALLOWED_FIELD_TYPES.includes(fieldType)) {
    throw new AppError(`Invalid field type. Allowed: ${ALLOWED_FIELD_TYPES.join(', ')}`, 400, 'INVALID_FIELD_TYPE');
  }
  if (SYSTEM_FIELD_KEYS.has(fieldKey)) {
    const allowed = SYSTEM_FIELDS[fieldKey].types;
    if (!allowed.includes(fieldType)) {
      throw new AppError(`"${fieldKey}" is a system field and only supports field type: ${allowed.join(', ')}`, 400, 'SYSTEM_FIELD_TYPE_LOCKED');
    }
  }
  if (OPTION_FIELD_TYPES.has(fieldType)) {
    const normalized = normalizeOptions(options);
    if (!normalized || normalized.length === 0) {
      throw new AppError('Options are required for select and radio fields', 400, 'OPTIONS_REQUIRED');
    }
  }
}

export async function createField(formType, data, actor) {
  const form = await findFormOrCreate(formType);
  const { fieldKey, label, fieldType, placeholder, helpText, defaultValue, validation, options, isRequired, isActive } = data;

  assertValidFieldDefinition({ fieldKey, label, fieldType, options });

  const systemDef = SYSTEM_FIELDS[fieldKey];
  if (systemDef) {
    const shouldBeRequired = systemDef.essential ? true : isRequired !== undefined ? !!isRequired : systemDef.defaultRequired;
    return sequelize.transaction(async (t) => {
      const exists = await RegistrationField.findOne({ where: { registrationFormId: form.id, fieldKey }, transaction: t });
      if (exists) throw new AppError('A field with this key already exists in this form', 409, 'FIELD_KEY_EXISTS');

      const field = await RegistrationField.create(
        {
          registrationFormId: form.id,
          fieldKey,
          label,
          fieldType,
          placeholder,
          helpText,
          defaultValue: defaultValue ?? null,
          validationRules: validation || {},
          options: normalizeOptions(options),
          isRequired: shouldBeRequired,
          isActive: systemDef.essential ? true : isActive !== undefined ? !!isActive : true,
          isSystemField: true,
          displayOrder: await nextDisplayOrder(form.id, t),
        },
        { transaction: t }
      );

      await auditLog('registrationForm.fieldCreate', actor, { formType, fieldKey, label, fieldType, isRequired: shouldBeRequired }, t);
      return serializeField(field);
    });
  }

  return sequelize.transaction(async (t) => {
    const exists = await RegistrationField.findOne({ where: { registrationFormId: form.id, fieldKey }, transaction: t });
    if (exists) throw new AppError('A field with this key already exists in this form', 409, 'FIELD_KEY_EXISTS');

    const field = await RegistrationField.create(
      {
        registrationFormId: form.id,
        fieldKey,
        label,
        fieldType,
        placeholder,
        helpText,
        defaultValue: defaultValue ?? null,
        validationRules: validation || {},
        options: normalizeOptions(options),
        isRequired: !!isRequired,
        isActive: isActive !== undefined ? !!isActive : true,
        isSystemField: false,
        displayOrder: await nextDisplayOrder(form.id, t),
      },
      { transaction: t }
    );

    await auditLog('registrationForm.fieldCreate', actor, { formType, fieldKey, label, fieldType, isRequired: !!isRequired }, t);
    return serializeField(field);
  });
}

async function nextDisplayOrder(formId, transaction) {
  const last = await RegistrationField.max('displayOrder', { where: { registrationFormId: formId }, transaction });
  return (last ?? -1) + 1;
}

export async function updateField(formType, fieldId, data, actor) {
  const form = await findFormOrCreate(formType);
  const field = await RegistrationField.findOne({ where: { id: fieldId, registrationFormId: form.id } });
  if (!field) throw new AppError('Field not found', 404, 'FIELD_NOT_FOUND');

  const systemDef = field.isSystemField ? SYSTEM_FIELDS[field.fieldKey] : null;

  return sequelize.transaction(async (t) => {
    const changes = {};

    if (data.label !== undefined) {
      if (!String(data.label).trim()) throw new AppError('Label is required', 400, 'LABEL_REQUIRED');
      if (String(data.label).trim().length > 120) throw new AppError('Label cannot exceed 120 characters', 400, 'INVALID_LABEL');
      changes.label = String(data.label).trim();
    }

    if (field.isSystemField) {
      // System fields: key + type are locked; essential fields keep isRequired/isActive.
      if (data.fieldKey !== undefined && data.fieldKey !== field.fieldKey) {
        throw new AppError('System field keys cannot be changed', 400, 'SYSTEM_FIELD_KEY_LOCKED');
      }
      if (data.fieldType !== undefined && data.fieldType !== field.fieldType) {
        throw new AppError('System field type cannot be changed', 400, 'SYSTEM_FIELD_TYPE_LOCKED');
      }
      if (systemDef?.essential) {
        if (data.isRequired !== undefined && !data.isRequired) {
          throw new AppError(`"${field.label}" is essential for registration and cannot be made optional`, 400, 'ESSENTIAL_FIELD_REQUIRED');
        }
        if (data.isActive !== undefined && !data.isActive) {
          throw new AppError(`"${field.label}" is essential for registration and cannot be hidden`, 400, 'ESSENTIAL_FIELD_ACTIVE');
        }
      }
    } else if (data.fieldKey !== undefined && data.fieldKey !== field.fieldKey) {
      assertValidFieldDefinition({ fieldKey: data.fieldKey, label: data.label ?? field.label, fieldType: data.fieldType ?? field.fieldType, options: data.options ?? field.options });
      const dup = await RegistrationField.findOne({ where: { registrationFormId: form.id, fieldKey: data.fieldKey, id: { [Op.ne]: field.id } }, transaction: t });
      if (dup) throw new AppError('A field with this key already exists in this form', 409, 'FIELD_KEY_EXISTS');
      changes.fieldKey = data.fieldKey;
    }

    if (data.fieldType !== undefined && data.fieldType !== field.fieldType && !field.isSystemField) {
      assertValidFieldDefinition({ fieldKey: field.fieldKey, label: field.label, fieldType: data.fieldType, options: data.options });
      changes.fieldType = data.fieldType;
    }

    if (data.placeholder !== undefined) changes.placeholder = data.placeholder;
    if (data.helpText !== undefined) changes.helpText = data.helpText;
    if (data.defaultValue !== undefined) changes.defaultValue = data.defaultValue ?? null;
    if (data.validation !== undefined) changes.validationRules = data.validation || {};
    if (data.options !== undefined) {
      if (OPTION_FIELD_TYPES.has(field.fieldType) && !normalizeOptions(data.options)?.length) {
        throw new AppError('Options are required for select and radio fields', 400, 'OPTIONS_REQUIRED');
      }
      changes.options = normalizeOptions(data.options);
    }
    if (data.isRequired !== undefined) {
      if (systemDef?.essential && !data.isRequired) {
        throw new AppError(`"${field.label}" is essential for registration and cannot be made optional`, 400, 'ESSENTIAL_FIELD_REQUIRED');
      }
      changes.isRequired = !!data.isRequired;
    }
    if (data.isActive !== undefined) {
      if (systemDef?.essential && !data.isActive) {
        throw new AppError(`"${field.label}" is essential for registration and cannot be hidden`, 400, 'ESSENTIAL_FIELD_ACTIVE');
      }
      changes.isActive = !!data.isActive;
    }

    if (Object.keys(changes).length > 0) {
      await field.update(changes, { transaction: t });
      await auditLog('registrationForm.fieldUpdate', actor, { formType, fieldId: field.id, fieldKey: field.fieldKey, changes }, t);
    }

    return serializeField(field);
  });
}

export async function deleteField(formType, fieldId, actor) {
  const form = await findFormOrCreate(formType);
  const field = await RegistrationField.findOne({ where: { id: fieldId, registrationFormId: form.id } });
  if (!field) throw new AppError('Field not found', 404, 'FIELD_NOT_FOUND');
  if (field.isSystemField) {
    throw new AppError('System fields cannot be deleted. Deactivate them instead.', 400, 'SYSTEM_FIELD_DELETE_FORBIDDEN');
  }

  await sequelize.transaction(async (t) => {
    const deletedKey = field.fieldKey;
    await field.destroy({ transaction: t });
    await auditLog('registrationForm.fieldDelete', actor, { formType, fieldId: field.id, fieldKey: deletedKey, label: field.label }, t);
  });

  return true;
}

export async function reorderFields(formType, orderedKeys, actor) {
  const form = await findFormOrCreate(formType);
  const fields = await findFieldsForForm(form.id);
  if (!Array.isArray(orderedKeys) || orderedKeys.length !== fields.length) {
    throw new AppError('Ordered keys must match the current field list', 400, 'INVALID_REORDER');
  }
  const byKey = new Map(fields.map((f) => [f.fieldKey, f]));
  const missing = orderedKeys.filter((k) => !byKey.has(k));
  if (missing.length) throw new AppError(`Unknown field key: ${missing.join(', ')}`, 400, 'INVALID_REORDER');

  await sequelize.transaction(async (t) => {
    for (let i = 0; i < orderedKeys.length; i += 1) {
      const field = byKey.get(orderedKeys[i]);
      if (field.displayOrder !== i) await field.update({ displayOrder: i }, { transaction: t });
    }
    await auditLog('registrationForm.fieldReorder', actor, { formType, order: orderedKeys }, t);
  });

  const updated = await findFieldsForForm(form.id);
  return updated.map(serializeField);
}

export async function updateFormMeta(formType, data, actor) {
  const form = await findFormOrCreate(formType);
  const changes = {};
  if (data.name !== undefined) {
    if (!String(data.name).trim()) throw new AppError('Form name is required', 400, 'NAME_REQUIRED');
    changes.name = String(data.name).trim();
  }
  if (data.description !== undefined) changes.description = data.description;
  if (data.isActive !== undefined) changes.isActive = !!data.isActive;

  if (Object.keys(changes).length > 0) {
    await sequelize.transaction(async (t) => {
      await form.update(changes, { transaction: t });
      await auditLog('registrationForm.update', actor, { formType, changes }, t);
    });
  }
  const fields = await findFieldsForForm(form.id);
  return serializeForm(form, fields);
}

// ---------------------------------------------------------------------------
// Dynamic validation & extraction of a registration/employee payload
// ---------------------------------------------------------------------------

function validateRawValue(field, raw, errors) {
  const { fieldType } = field;
  const rules = field.validationRules || {};

  if (fieldType === 'number') {
    const num = Number(raw);
    if (!Number.isFinite(num)) {
      errors[field.fieldKey] = `${field.label} must be a valid number.`;
      return null;
    }
    if (rules.min !== undefined && num < Number(rules.min)) errors[field.fieldKey] = `${field.label} must be at least ${rules.min}.`;
    if (rules.max !== undefined && num > Number(rules.max)) errors[field.fieldKey] = `${field.label} must be at most ${rules.max}.`;
    return num;
  }

  if (fieldType === 'email') {
    if (!EMAIL_PATTERN.test(String(raw).trim())) {
      errors[field.fieldKey] = `Enter a valid email for ${field.label}.`;
      return null;
    }
    return String(raw).trim();
  }

  if (fieldType === 'phone') {
    if (!INDIAN_MOBILE.test(String(raw).trim())) {
      errors[field.fieldKey] = `${field.label} must be a valid 10 digit mobile number.`;
      return null;
    }
    return String(raw).trim();
  }

  if (fieldType === 'password') {
    if (String(raw).length < 6) {
      errors[field.fieldKey] = `${field.label} must be at least 6 characters.`;
      return null;
    }
    return String(raw);
  }

  if (fieldType === 'date') {
    if (Number.isNaN(Date.parse(String(raw)))) {
      errors[field.fieldKey] = `${field.label} must be a valid date.`;
      return null;
    }
    return String(raw);
  }

  if (fieldType === 'checkbox') {
    if (typeof raw === 'boolean') return raw;
    if (raw === 'true' || raw === 'on') return true;
    if (raw === 'false' || raw === 'off' || raw === '') return false;
    return Boolean(raw);
  }

  if (fieldType === 'select' || fieldType === 'radio') {
    const options = normalizeOptions(field.options) || [];
    const validValues = new Set(options.map((o) => o.value));
    const str = String(raw).trim();
    if (!validValues.has(str)) {
      errors[field.fieldKey] = `Please select a valid option for ${field.label}.`;
      return null;
    }
    return str;
  }

  if (fieldType === 'file') {
    const urls = String(raw)
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);
    if (urls.length === 0 || urls.some((u) => !/^https?:\/\//i.test(u))) {
      errors[field.fieldKey] = `${field.label} file is required.`;
      return null;
    }
    return urls.join(',');
  }

  // text / textarea
  const str = String(raw);
  const trimmed = str.trim();
  if (rules.minLength !== undefined && trimmed.length < Number(rules.minLength)) {
    errors[field.fieldKey] = `${field.label} must be at least ${rules.minLength} characters.`;
  }
  if (rules.maxLength !== undefined && trimmed.length > Number(rules.maxLength)) {
    errors[field.fieldKey] = `${field.label} must be at most ${rules.maxLength} characters.`;
  }
  if (rules.pattern) {
    try {
      const re = new RegExp(rules.pattern);
      if (!re.test(trimmed)) errors[field.fieldKey] = `${field.label} format is invalid.`;
    } catch {
      // ignore malformed pattern
    }
  }
  return trimmed;
}

/**
 * Validates a registration payload against the active CMS config for the role's
 * form type. Returns extracted profile fields, custom fields and password.
 *
 * Throws AppError(400, 'VALIDATION_ERROR', errorsMap) when fields are missing or
 * invalid. Never accepts keys outside the active config.
 */
export async function validateAndExtractRegistrationData(role, body, options = {}) {
  const formType = ROLE_TO_FORM_TYPE[role];
  const form = await findFormOrCreate(formType);
  if (!form.isActive) {
    throw new AppError(`${form.name} is currently disabled. Please try again later.`, 409, 'FORM_DISABLED');
  }

  const fields = await findFieldsForForm(form.id, { activeOnly: true });
  if (fields.length === 0) {
    throw new AppError(`${form.name} has no active fields configured. Please contact support.`, 409, 'FORM_EMPTY');
  }

  const customPayload = (body && typeof body.customFields === 'object' && body.customFields !== null && !Array.isArray(body.customFields)) ? body.customFields : {};

  const allowedMeta = new Set(SUBMISSION_META_KEYS);
  if (options.allowPermissions) allowedMeta.add('permissions');

  const errors = {};
  const standard = {};
  const roleDetail = {};
  const customFields = {};
  let password = null;
  let confirmPassword = null;
  const activeKeys = new Set(fields.map((f) => f.fieldKey));

  for (const field of fields) {
    const { fieldKey } = field;
    const isSystem = SYSTEM_FIELDS[fieldKey];
    const raw = isSystem ? body[fieldKey] : customPayload[fieldKey];
    const provided = raw !== undefined && raw !== null && raw !== '';

    if (field.isRequired && !provided) {
      errors[fieldKey] = `${field.label} is required.`;
      continue;
    }
    if (!provided) continue;

    const validated = validateRawValue(field, raw, errors);
    if (validated === null) continue; // already recorded an error

    if (fieldKey === 'confirmPassword') {
      confirmPassword = String(validated);
      continue;
    }

    if (isSystem) {
      const { column } = isSystem;
      if (column === 'password') {
        password = String(validated);
      } else if (column.startsWith('roleDetail.')) {
        roleDetail[column.split('.')[1]] = validated;
      } else {
        standard[column] = validated;
      }
    } else {
      customFields[fieldKey] = validated;
    }
  }

  if (confirmPassword !== null && password !== null && confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  if (password !== null && confirmPassword === null && fields.some((f) => f.fieldKey === 'confirmPassword' && f.isRequired)) {
    errors.confirmPassword = 'Confirm Password is required.';
  }

  // Employees register with separate first/last name fields; keep users.name in
  // sync so name-based lookups (notifications, activity logs) stay consistent.
  if (!standard.name) {
    const first = roleDetail.firstName;
    const last = roleDetail.lastName;
    if (first || last) {
      standard.name = [first, last].filter(Boolean).join(' ').trim();
    }
  }

  // Reject anything sent that is not an active field (guards against tampering).
  for (const key of Object.keys(body)) {
    if (key === 'customFields') {
      for (const ck of Object.keys(customPayload)) {
        if (!activeKeys.has(ck) && !SYSTEM_FIELDS[ck]) {
          if (FORBIDDEN_KEYS.has(ck)) {
            throw new AppError(`Field "${ck}" is not allowed`, 400, 'FORBIDDEN_FIELD');
          }
          throw new AppError(`Field "${ck}" is not part of the active registration form`, 400, 'UNKNOWN_FIELD');
        }
      }
      continue;
    }
    if (allowedMeta.has(key) || activeKeys.has(key)) continue;
    if (FORBIDDEN_KEYS.has(key)) {
      throw new AppError(`Field "${key}" is not allowed`, 400, 'FORBIDDEN_FIELD');
    }
    throw new AppError(`Field "${key}" is not part of the active registration form`, 400, 'UNKNOWN_FIELD');
  }

  if (Object.keys(errors).length > 0) {
    throw new AppError('Please complete all mandatory fields.', 400, 'VALIDATION_ERROR', errors);
  }

  return { standard, roleDetail, customFields, password };
}
