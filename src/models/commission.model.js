import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Commission = sequelize.define(
  'Commission',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    propertyId: { type: DataTypes.UUID, allowNull: false },
    mediatorId: { type: DataTypes.UUID, allowNull: true },
    employeeId: { type: DataTypes.UUID, allowNull: true },
    amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.ENUM('pending', 'approved', 'paid'), defaultValue: 'pending' },
    note: { type: DataTypes.TEXT },
  },
  { tableName: 'commissions', indexes: [{ fields: ['property_id'] }, { fields: ['mediator_id'] }] }
);

export default Commission;
