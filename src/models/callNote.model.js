import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CallNote = sequelize.define(
  'CallNote',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    enquiryId: { type: DataTypes.UUID, allowNull: false },
    createdBy: { type: DataTypes.UUID, allowNull: false },
    callDateTime: { type: DataTypes.DATE, allowNull: false },
    direction: { type: DataTypes.ENUM('incoming', 'outgoing'), allowNull: false },
    result: { type: DataTypes.STRING },
    summary: { type: DataTypes.TEXT },
    interestLevel: { type: DataTypes.ENUM('low', 'medium', 'high') },
    nextAction: { type: DataTypes.STRING },
    nextFollowUpAt: { type: DataTypes.DATE },
  },
  { tableName: 'call_notes', indexes: [{ fields: ['enquiry_id'] }] }
);

export default CallNote;
