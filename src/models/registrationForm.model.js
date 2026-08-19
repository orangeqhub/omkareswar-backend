import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

// One row per registrable role (BUYER, SELLER, EMPLOYEE, MEDIATOR).
// The fields each form collects are stored in registration_fields.
const RegistrationForm = sequelize.define(
  'RegistrationForm',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    formType: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: 'registration_forms',
    indexes: [{ fields: ['form_type'] }],
  }
);

export default RegistrationForm;
