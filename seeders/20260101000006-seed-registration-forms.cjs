'use strict';

const crypto = require('crypto');

// Default registration form configs. Mirrors backend/src/constants/registrationForms.js.
// The runtime also auto-seeds these via ensureDefaultForms(), so this seeder is a
// no-op when the tables already contain rows (idempotent).
const DEFAULT_FORMS = [
  {
    formType: 'BUYER',
    name: 'Buyer Registration',
    description: 'Fields shown on the buyer registration form',
    fields: [
      { fieldKey: 'name', label: 'Full Name', fieldType: 'text', isRequired: true, displayOrder: 1 },
      { fieldKey: 'mobile', label: 'Mobile', fieldType: 'phone', isRequired: true, displayOrder: 2, placeholder: '10 digit mobile number' },
      { fieldKey: 'email', label: 'Email', fieldType: 'email', isRequired: false, displayOrder: 3, placeholder: 'name@example.com' },
      { fieldKey: 'district', label: 'District', fieldType: 'text', isRequired: true, displayOrder: 4 },
      { fieldKey: 'city', label: 'City', fieldType: 'text', isRequired: true, displayOrder: 5 },
      { fieldKey: 'address', label: 'Address', fieldType: 'textarea', isRequired: true, displayOrder: 6 },
    ],
  },
  {
    formType: 'SELLER',
    name: 'Seller Registration',
    description: 'Fields shown on the seller registration form',
    fields: [
      { fieldKey: 'name', label: 'Full Name', fieldType: 'text', isRequired: true, displayOrder: 1 },
      { fieldKey: 'mobile', label: 'Mobile', fieldType: 'phone', isRequired: true, displayOrder: 2, placeholder: '10 digit mobile number' },
      { fieldKey: 'email', label: 'Email', fieldType: 'email', isRequired: false, displayOrder: 3, placeholder: 'name@example.com' },
      { fieldKey: 'district', label: 'District', fieldType: 'text', isRequired: true, displayOrder: 4 },
      { fieldKey: 'city', label: 'City', fieldType: 'text', isRequired: true, displayOrder: 5 },
      { fieldKey: 'address', label: 'Address', fieldType: 'textarea', isRequired: true, displayOrder: 6 },
    ],
  },
  {
    formType: 'MEDIATOR',
    name: 'Mediator Registration',
    description: 'Fields shown on the mediator registration form',
    fields: [
      { fieldKey: 'name', label: 'Full Name', fieldType: 'text', isRequired: true, displayOrder: 1 },
      { fieldKey: 'mobile', label: 'Mobile', fieldType: 'phone', isRequired: true, displayOrder: 2, placeholder: '10 digit mobile number' },
      { fieldKey: 'email', label: 'Email', fieldType: 'email', isRequired: false, displayOrder: 3, placeholder: 'name@example.com' },
      { fieldKey: 'district', label: 'District', fieldType: 'text', isRequired: true, displayOrder: 4 },
      { fieldKey: 'city', label: 'City', fieldType: 'text', isRequired: true, displayOrder: 5 },
      { fieldKey: 'address', label: 'Address', fieldType: 'textarea', isRequired: true, displayOrder: 6 },
    ],
  },
  {
    formType: 'EMPLOYEE',
    name: 'Employee Registration',
    description: 'Fields shown on the employee registration and admin employee creation form',
    fields: [
      { fieldKey: 'firstName', label: 'First Name', fieldType: 'text', isRequired: true, displayOrder: 1 },
      { fieldKey: 'lastName', label: 'Last Name', fieldType: 'text', isRequired: true, displayOrder: 2 },
      { fieldKey: 'mobile', label: 'Mobile', fieldType: 'phone', isRequired: true, displayOrder: 3, placeholder: '10 digit mobile number' },
      { fieldKey: 'email', label: 'Email', fieldType: 'email', isRequired: false, displayOrder: 4, placeholder: 'name@example.com' },
      { fieldKey: 'password', label: 'Password', fieldType: 'password', isRequired: true, displayOrder: 5 },
      { fieldKey: 'confirmPassword', label: 'Confirm Password', fieldType: 'password', isRequired: true, displayOrder: 6 },
      { fieldKey: 'panCard', label: 'PAN Card', fieldType: 'file', isRequired: true, displayOrder: 7 },
      { fieldKey: 'aadhaarCard', label: 'Aadhaar Card', fieldType: 'file', isRequired: true, displayOrder: 8 },
      { fieldKey: 'certificates', label: 'Certificates', fieldType: 'file', isRequired: false, displayOrder: 9 },
    ],
  },
];

const SYSTEM_KEYS = new Set(['name', 'mobile', 'email', 'district', 'city', 'address', 'password', 'confirmPassword', 'firstName', 'lastName', 'aadhaarCard', 'panCard', 'certificate10th', 'certificates']);

module.exports = {
  up: async (queryInterface) => {
    for (const def of DEFAULT_FORMS) {
      const [existing] = await queryInterface.sequelize.query('SELECT id FROM registration_forms WHERE form_type = ? LIMIT 1', {
        replacements: [def.formType],
      });
      if (existing.length) continue;

      const formId = crypto.randomUUID();
      await queryInterface.bulkInsert('registration_forms', [
        {
          id: formId,
          form_type: def.formType,
          name: def.name,
          description: def.description,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      await queryInterface.bulkInsert(
        'registration_fields',
        def.fields.map((f) => ({
          id: crypto.randomUUID(),
          registration_form_id: formId,
          field_key: f.fieldKey,
          label: f.label,
          field_type: f.fieldType,
          placeholder: f.placeholder || null,
          help_text: null,
          default_value: null,
          validation_rules: JSON.stringify({}),
          options: null,
          is_required: f.isRequired,
          is_active: true,
          is_system_field: SYSTEM_KEYS.has(f.fieldKey),
          display_order: f.displayOrder,
          created_at: new Date(),
          updated_at: new Date(),
        }))
      );
    }
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query('DELETE FROM registration_fields');
    await queryInterface.sequelize.query('DELETE FROM registration_forms');
  },
};
