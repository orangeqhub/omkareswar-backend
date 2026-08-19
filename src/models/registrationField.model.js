import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

// A single field of a registration form. field_key maps to a standard users
// column (system fields) or is stored inside users.custom_fields (custom fields).
const RegistrationField = sequelize.define(
  'RegistrationField',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    registrationFormId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'registration_forms', key: 'id' },
      onDelete: 'CASCADE',
    },
    fieldKey: { type: DataTypes.STRING(64), allowNull: false },
    label: { type: DataTypes.STRING(120), allowNull: false },
    fieldType: { type: DataTypes.STRING(20), allowNull: false },
    placeholder: { type: DataTypes.STRING(255) },
    helpText: { type: DataTypes.TEXT },
    defaultValue: { type: DataTypes.JSONB },
    validationRules: { type: DataTypes.JSONB, defaultValue: {} },
    options: { type: DataTypes.JSONB },
    isRequired: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    isSystemField: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    displayOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'registration_fields',
    indexes: [
      { fields: ['registration_form_id'] },
      { fields: ['display_order'] },
      { fields: ['registration_form_id', 'field_key'], unique: true },
    ],
  }
);

export default RegistrationField;
