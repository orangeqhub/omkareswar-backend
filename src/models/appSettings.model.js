import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

// Single-row table holding site-wide app settings.
const AppSettings = sequelize.define(
  'AppSettings',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, defaultValue: 1 },
    autoApproveRegistrations: { type: DataTypes.BOOLEAN, defaultValue: false },
    autoApproveProperties: { type: DataTypes.BOOLEAN, defaultValue: false },
    maxImageSizeMb: { type: DataTypes.INTEGER, defaultValue: 5 },
    customLocations: { type: DataTypes.JSON, defaultValue: [] },
    propertyFields: { type: DataTypes.JSON, defaultValue: [] },
    fieldConfig: { type: DataTypes.JSON, defaultValue: {} },
  },
  { tableName: 'app_settings' }
);

export default AppSettings;
