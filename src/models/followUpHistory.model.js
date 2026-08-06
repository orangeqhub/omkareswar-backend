import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const FollowUpHistory = sequelize.define(
  'FollowUpHistory',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    followUpId: { type: DataTypes.UUID, allowNull: false },
    actorId: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.STRING, allowNull: false },
    note: { type: DataTypes.TEXT },
    statusAfter: { type: DataTypes.STRING },
  },
  { tableName: 'follow_up_histories', indexes: [{ fields: ['follow_up_id'] }] }
);

export default FollowUpHistory;
