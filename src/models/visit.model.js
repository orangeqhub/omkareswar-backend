import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Visit = sequelize.define(
  'Visit',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    visitCode: { type: DataTypes.STRING, unique: true }, // VIS-YYYY-000001
    propertyId: { type: DataTypes.UUID, allowNull: false },
    buyerId: { type: DataTypes.UUID, allowNull: false },
    sellerId: { type: DataTypes.UUID, allowNull: false },
    buyerName: { type: DataTypes.STRING },
    scheduledFor: { type: DataTypes.DATE, allowNull: false },
    meetingLocation: { type: DataTypes.STRING },
    status: {
      type: DataTypes.ENUM('scheduled', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'no_show'),
      defaultValue: 'scheduled',
    },
    outcome: { type: DataTypes.STRING },
    notes: { type: DataTypes.JSONB, defaultValue: [] },
    assignedMediatorId: { type: DataTypes.UUID, allowNull: true },
    assignedEmployeeId: { type: DataTypes.UUID, allowNull: true },
    assignedBy: { type: DataTypes.UUID, allowNull: true },
    assignmentNote: { type: DataTypes.TEXT },
    assignmentDueAt: { type: DataTypes.DATE },
  },
  {
    tableName: 'visits',
    indexes: [{ fields: ['property_id'] }, { fields: ['buyer_id'] }, { fields: ['seller_id'] }, { fields: ['status'] }],
  }
);

export default Visit;
