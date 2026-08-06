import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const InternalNote = sequelize.define(
  'InternalNote',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    recordType: { type: DataTypes.STRING, allowNull: false },
    recordId: { type: DataTypes.UUID, allowNull: false },
    authorId: { type: DataTypes.UUID, allowNull: false },
    text: { type: DataTypes.TEXT, allowNull: false },
    visibility: { type: DataTypes.STRING, defaultValue: 'employee_admin' }, // never exposed to buyer/seller/mediator
  },
  { tableName: 'internal_notes', indexes: [{ fields: ['record_type', 'record_id'] }] }
);

export default InternalNote;
