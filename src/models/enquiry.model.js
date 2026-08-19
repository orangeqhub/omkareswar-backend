import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Enquiry = sequelize.define(
  'Enquiry',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    enquiryCode: { type: DataTypes.STRING, unique: true }, // ENQ-YYYY-000001
    propertyId: { type: DataTypes.UUID, allowNull: true },
    sellerId: { type: DataTypes.UUID, allowNull: true },
    buyerId: { type: DataTypes.UUID, allowNull: true },
    buyerName: { type: DataTypes.STRING, allowNull: false },
    buyerPhone: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT },
  channel: {
  type: DataTypes.ENUM(
    'whatsapp',
    'call',
    'contact',
    'interest',
    'email'
  ),
  allowNull: false,
  defaultValue: 'contact',
},
    status: {
      type: DataTypes.ENUM('new', 'contacted', 'followup_required', 'visit_requested', 'closed'),
      defaultValue: 'new',
    },
    pendingStatus: { type: DataTypes.STRING, allowNull: true },
    priority: { type: DataTypes.ENUM('low', 'medium', 'high'), defaultValue: 'medium' },
    nextFollowUpAt: { type: DataTypes.DATE },
    assignedEmployeeId: { type: DataTypes.UUID, allowNull: true },
    assignedMediatorId: { type: DataTypes.UUID, allowNull: true },
    assignedBy: { type: DataTypes.UUID, allowNull: true },
    completedAt: { type: DataTypes.DATE },
  },
  {
    tableName: 'enquiries',
    indexes: [{ fields: ['property_id'] }, { fields: ['seller_id'] }, { fields: ['status'] }],
  }
);

export default Enquiry;
