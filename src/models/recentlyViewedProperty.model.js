import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RecentlyViewedProperty = sequelize.define(
  'RecentlyViewedProperty',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    propertyId: { type: DataTypes.UUID, allowNull: false },
    viewedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'recently_viewed_properties',
    indexes: [{ unique: true, fields: ['user_id', 'property_id'] }],
  }
);

export default RecentlyViewedProperty;
