import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PropertyModerationHistory = sequelize.define(
  'PropertyModerationHistory',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    propertyId: { type: DataTypes.UUID, allowNull: false },
    actorId: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.STRING, allowNull: false }, // start, add_note, request_changes, recommend_approval, recommend_rejection, complete
    note: { type: DataTypes.TEXT },
    fields: { type: DataTypes.JSONB, defaultValue: [] },
    slots: { type: DataTypes.JSONB, defaultValue: [] },
    statusAfter: { type: DataTypes.STRING },
  },
  { tableName: 'property_moderation_histories', indexes: [{ fields: ['property_id'] }] }
);

export default PropertyModerationHistory;
