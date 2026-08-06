import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserCorrectionHistory = sequelize.define(
  'UserCorrectionHistory',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    actorId: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.STRING, allowNull: false }, // start_review, correction_request, recommend_approval, recommend_rejection, complete
    reason: { type: DataTypes.TEXT },
    fields: { type: DataTypes.JSONB, defaultValue: [] },
    statusAfter: { type: DataTypes.STRING },
  },
  { tableName: 'user_correction_histories', indexes: [{ fields: ['user_id'] }] }
);

export default UserCorrectionHistory;
