'use strict';

const crypto = require('crypto');

// Mirrors backend/src/constants/registrationForms.js DEFAULT_FORMS employee
// config: first/last name split, PAN/Aadhaar uploads and a multi-file
// "Certificates" field. Applied on top of any previously seeded config.
const EMPLOYEE_FIELDS = [
  { fieldKey: 'firstName', label: 'First Name', fieldType: 'text', isRequired: true, displayOrder: 1 },
  { fieldKey: 'lastName', label: 'Last Name', fieldType: 'text', isRequired: true, displayOrder: 2 },
  { fieldKey: 'mobile', label: 'Mobile', fieldType: 'phone', isRequired: true, displayOrder: 3, placeholder: '10 digit mobile number' },
  { fieldKey: 'email', label: 'Email', fieldType: 'email', isRequired: false, displayOrder: 4, placeholder: 'name@example.com' },
  { fieldKey: 'password', label: 'Password', fieldType: 'password', isRequired: true, displayOrder: 5 },
  { fieldKey: 'confirmPassword', label: 'Confirm Password', fieldType: 'password', isRequired: true, displayOrder: 6 },
  { fieldKey: 'panCard', label: 'PAN Card', fieldType: 'file', isRequired: true, displayOrder: 7 },
  { fieldKey: 'aadhaarCard', label: 'Aadhaar Card', fieldType: 'file', isRequired: true, displayOrder: 8 },
  { fieldKey: 'certificates', label: 'Certificates', fieldType: 'file', isRequired: false, displayOrder: 9 },
];

const SYSTEM_KEYS = new Set([
  'name', 'mobile', 'email', 'district', 'city', 'address', 'password', 'confirmPassword',
  'firstName', 'lastName', 'aadhaarCard', 'panCard', 'certificate10th', 'certificates',
]);

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDesc = await queryInterface.describeTable('users');
    if (!tableDesc.temp_password) {
      await queryInterface.addColumn('users', 'temp_password', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // Re-sync the EMPLOYEE registration form to the new default field set so
    // existing databases pick up the first/last name split and certificates.
    // Creates the form when it has never been seeded (older DBs).
    let [forms] = await queryInterface.sequelize.query(
      'SELECT id FROM registration_forms WHERE form_type = ? LIMIT 1',
      { replacements: ['EMPLOYEE'] }
    );

    let formId;
    if (forms.length) {
      formId = forms[0].id;
      await queryInterface.sequelize.query(
        'DELETE FROM registration_fields WHERE registration_form_id = ?',
        { replacements: [formId] }
      );
    } else {
      formId = crypto.randomUUID();
      await queryInterface.bulkInsert('registration_forms', [
        {
          id: formId,
          form_type: 'EMPLOYEE',
          name: 'Employee Registration',
          description: 'Fields shown on the employee registration and admin employee creation form',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    await queryInterface.bulkInsert(
      'registration_fields',
      EMPLOYEE_FIELDS.map((f) => ({
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
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'temp_password');
  },
};
