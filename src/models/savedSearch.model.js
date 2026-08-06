import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SavedSearch = sequelize.define(
  'SavedSearch',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    city: { type: DataTypes.STRING },
    categorySlug: { type: DataTypes.STRING },
    minPrice: { type: DataTypes.DECIMAL(14, 2) },
    maxPrice: { type: DataTypes.DECIMAL(14, 2) },
  },
  { tableName: 'saved_searches', indexes: [{ fields: ['user_id'] }] }
);

export default SavedSearch;
