/**
 * Registration form CMS definitions.
 *
 * Registration forms are stored in the DB (registration_forms + registration_fields)
 * and rendered/validated dynamically. This file holds the fixed vocabulary that
 * admin-created fields must respect: form types, allowed field types, the registry
 * of system fields that map to existing users columns, and the default configs used
 * to seed new installations (which mirror the app's original hardcoded forms).
 */

export const FORM_TYPES = {
  BUYER: 'BUYER',
  SELLER: 'SELLER',
  EMPLOYEE: 'EMPLOYEE',
  MEDIATOR: 'MEDIATOR',
};

export const FORM_TYPES_LIST = Object.values(FORM_TYPES);

// users.role -> formType
export const ROLE_TO_FORM_TYPE = {
  buyer: FORM_TYPES.BUYER,
  seller: FORM_TYPES.SELLER,
  employee: FORM_TYPES.EMPLOYEE,
  mediator: FORM_TYPES.MEDIATOR,
};

export const FIELD_TYPES = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  NUMBER: 'number',
  EMAIL: 'email',
  PHONE: 'phone',
  PASSWORD: 'password',
  DATE: 'date',
  SELECT: 'select',
  RADIO: 'radio',
  CHECKBOX: 'checkbox',
  FILE: 'file',
};

export const ALLOWED_FIELD_TYPES = Object.values(FIELD_TYPES);

export const OPTION_FIELD_TYPES = new Set([FIELD_TYPES.SELECT, FIELD_TYPES.RADIO]);

/**
 * Registry of system fields. Each entry describes how the field value is persisted:
 *   column   -> users column (plain path) or a dotted path into users.roleDetail
 *   virtual  -> value is derived (e.g. confirmPassword) and never persisted
 *   essential -> the value can never be removed or made optional (login/mobile/password)
 *   employeeOnly -> only seeded into the EMPLOYEE form
 */
export const SYSTEM_FIELDS = {
  name: {
    column: 'name',
    types: [FIELD_TYPES.TEXT],
    essential: true,
    defaultRequired: true,
    label: 'Full Name',
  },
  firstName: {
    column: 'roleDetail.firstName',
    types: [FIELD_TYPES.TEXT],
    essential: false,
    defaultRequired: true,
    label: 'First Name',
    employeeOnly: true,
  },
  lastName: {
    column: 'roleDetail.lastName',
    types: [FIELD_TYPES.TEXT],
    essential: false,
    defaultRequired: true,
    label: 'Last Name',
    employeeOnly: true,
  },
  mobile: {
    column: 'mobile',
    types: [FIELD_TYPES.PHONE, FIELD_TYPES.TEXT],
    essential: true,
    defaultRequired: true,
    label: 'Mobile',
  },
  altMobile: {
    column: 'altMobile',
    types: [FIELD_TYPES.PHONE, FIELD_TYPES.TEXT],
    essential: false,
    defaultRequired: false,
    label: 'Alternate Mobile',
  },
  email: {
    column: 'email',
    types: [FIELD_TYPES.EMAIL],
    essential: false,
    defaultRequired: false,
    label: 'Email',
  },
  district: {
    column: 'district',
    types: [FIELD_TYPES.TEXT, FIELD_TYPES.SELECT],
    essential: false,
    defaultRequired: true,
    label: 'District',
  },
  city: {
    column: 'city',
    types: [FIELD_TYPES.TEXT, FIELD_TYPES.SELECT],
    essential: false,
    defaultRequired: true,
    label: 'City',
  },
  address: {
    column: 'address',
    types: [FIELD_TYPES.TEXTAREA, FIELD_TYPES.TEXT],
    essential: false,
    defaultRequired: true,
    label: 'Address',
  },
  password: {
    column: 'password',
    types: [FIELD_TYPES.PASSWORD],
    essential: true,
    defaultRequired: true,
    label: 'Password',
    employeeOnly: true,
  },
  confirmPassword: {
    column: 'confirmPassword',
    types: [FIELD_TYPES.PASSWORD],
    essential: false,
    defaultRequired: true,
    label: 'Confirm Password',
    virtual: true,
    employeeOnly: true,
  },
  aadhaarCard: {
    column: 'roleDetail.aadhaarCard',
    types: [FIELD_TYPES.FILE],
    essential: false,
    defaultRequired: true,
    label: 'Aadhaar Card',
    employeeOnly: true,
  },
  panCard: {
    column: 'roleDetail.panCard',
    types: [FIELD_TYPES.FILE],
    essential: false,
    defaultRequired: true,
    label: 'PAN Card',
    employeeOnly: true,
  },
  certificate10th: {
    column: 'roleDetail.certificate10th',
    types: [FIELD_TYPES.FILE],
    essential: false,
    defaultRequired: false,
    label: '10th Certificate',
    employeeOnly: true,
  },
  certificates: {
    column: 'roleDetail.certificates',
    types: [FIELD_TYPES.FILE],
    essential: false,
    defaultRequired: false,
    label: 'Certificates',
    employeeOnly: true,
  },
};

// System field keys may have their key/type changed only by seeding; admin UI
// keeps them locked.
export const SYSTEM_FIELD_KEYS = new Set(Object.keys(SYSTEM_FIELDS));

// Keys that can never be used as a field key and are rejected from submission payloads.
// (System field keys like fullName/mobile/password are NOT here - they are valid
// submission values; they are only ever accepted when part of the active form config.)
export const FORBIDDEN_KEYS = new Set([
  'permissions',
  'passwordHash',
  'id',
  'memberId',
  'registrationId',
  'loginId',
  'status',
  'verificationStatus',
  'approvedBy',
  'approvedAt',
  'assignedMediatorId',
  'assignedEmployeeId',
  'rejectionReason',
  'correctionReason',
  'correctionFields',
  'lastLoginAt',
  'createdAt',
  'updatedAt',
  'customFields',
  'roleDetail',
  'profileImage',
]);

// Keys allowed in a registration submission payload that are not field keys.
export const SUBMISSION_META_KEYS = new Set(['role', 'customFields']);

const baseFields = [
  { fieldKey: 'name', label: 'Full Name', fieldType: FIELD_TYPES.TEXT, isRequired: true, displayOrder: 1 },
  { fieldKey: 'mobile', label: 'Mobile', fieldType: FIELD_TYPES.PHONE, isRequired: true, displayOrder: 2, placeholder: '10 digit mobile number' },
  { fieldKey: 'email', label: 'Email', fieldType: FIELD_TYPES.EMAIL, isRequired: false, displayOrder: 3, placeholder: 'name@example.com' },
  { fieldKey: 'district', label: 'District', fieldType: FIELD_TYPES.TEXT, isRequired: true, displayOrder: 4 },
  { fieldKey: 'city', label: 'City', fieldType: FIELD_TYPES.TEXT, isRequired: true, displayOrder: 5 },
  { fieldKey: 'address', label: 'Address', fieldType: FIELD_TYPES.TEXTAREA, isRequired: true, displayOrder: 6 },
];

const employeeFields = [
  { fieldKey: 'firstName', label: 'First Name', fieldType: FIELD_TYPES.TEXT, isRequired: true, displayOrder: 1 },
  { fieldKey: 'lastName', label: 'Last Name', fieldType: FIELD_TYPES.TEXT, isRequired: true, displayOrder: 2 },
  { fieldKey: 'mobile', label: 'Mobile', fieldType: FIELD_TYPES.PHONE, isRequired: true, displayOrder: 3, placeholder: '10 digit mobile number' },
  { fieldKey: 'email', label: 'Email', fieldType: FIELD_TYPES.EMAIL, isRequired: false, displayOrder: 4, placeholder: 'name@example.com' },
  { fieldKey: 'password', label: 'Password', fieldType: FIELD_TYPES.PASSWORD, isRequired: true, displayOrder: 5 },
  { fieldKey: 'confirmPassword', label: 'Confirm Password', fieldType: FIELD_TYPES.PASSWORD, isRequired: true, displayOrder: 6 },
  { fieldKey: 'panCard', label: 'PAN Card', fieldType: FIELD_TYPES.FILE, isRequired: true, displayOrder: 7 },
  { fieldKey: 'aadhaarCard', label: 'Aadhaar Card', fieldType: FIELD_TYPES.FILE, isRequired: true, displayOrder: 8 },
  { fieldKey: 'certificates', label: 'Certificates', fieldType: FIELD_TYPES.FILE, isRequired: false, displayOrder: 9 },
];

/**
 * Default configs used to seed a fresh database (also auto-created at runtime if
 * the forms table is empty). These mirror the app's original hardcoded forms so
 * existing registrations and tests keep working.
 */
export const DEFAULT_FORMS = [
  { formType: FORM_TYPES.BUYER, name: 'Buyer Registration', description: 'Fields shown on the buyer registration form', fields: baseFields },
  { formType: FORM_TYPES.SELLER, name: 'Seller Registration', description: 'Fields shown on the seller registration form', fields: baseFields },
  { formType: FORM_TYPES.MEDIATOR, name: 'Mediator Registration', description: 'Fields shown on the mediator registration form', fields: baseFields },
  { formType: FORM_TYPES.EMPLOYEE, name: 'Employee Registration', description: 'Fields shown on the employee registration and admin employee creation form', fields: employeeFields },
];
