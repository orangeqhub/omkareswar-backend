import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Favourite = sequelize.define(
  'Favourite',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    propertyId: { type: DataTypes.UUID, allowNull: false },
  },
  {
    tableName: 'favourites',
    indexes: [{ unique: true, fields: ['user_id', 'property_id'] }],
  }
);

export default Favourite;
