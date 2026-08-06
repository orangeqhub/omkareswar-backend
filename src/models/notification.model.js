import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Notification = sequelize.define(
  'Notification',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    audienceRole: { type: DataTypes.STRING, allowNull: true }, // null when targeted at a specific user
    audienceUserId: { type: DataTypes.UUID, allowNull: true },
    type: { type: DataTypes.STRING, allowNull: false },
    relatedType: { type: DataTypes.STRING },
    relatedId: { type: DataTypes.UUID },
    titleEn: { type: DataTypes.STRING, allowNull: false },
    titleTe: { type: DataTypes.STRING },
    read: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: 'notifications',
    indexes: [{ fields: ['audience_user_id'] }, { fields: ['audience_role'] }, { fields: ['read'] }],
  }
);

export default Notification;
