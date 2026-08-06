import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

// Polymorphic association: recordType + recordId point at enquiry / userVerification (user) / property / visit.
const FollowUp = sequelize.define(
  'FollowUp',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    recordType: { type: DataTypes.ENUM('enquiry', 'userVerification', 'property', 'visit'), allowNull: false },
    recordId: { type: DataTypes.UUID, allowNull: false },
    assignedEmployeeId: { type: DataTypes.UUID, allowNull: false },
    assignedBy: { type: DataTypes.UUID, allowNull: false },
    dueDate: { type: DataTypes.DATEONLY, allowNull: false },
    dueTime: { type: DataTypes.STRING }, // HH:mm
    priority: { type: DataTypes.ENUM('low', 'medium', 'high'), defaultValue: 'medium' },
    reason: { type: DataTypes.TEXT },
    nextAction: { type: DataTypes.STRING },
    status: { type: DataTypes.ENUM('assigned', 'in_progress', 'completed', 'cancelled'), defaultValue: 'assigned' },
    completionNote: { type: DataTypes.TEXT },
    notes: { type: DataTypes.JSONB, defaultValue: [] },
  },
  {
    tableName: 'follow_ups',
    indexes: [{ fields: ['assigned_employee_id'] }, { fields: ['status'] }, { fields: ['record_type', 'record_id'] }],
  }
);

export default FollowUp;
