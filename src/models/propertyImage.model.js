import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PropertyImage = sequelize.define(
  'PropertyImage',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    propertyId: { type: DataTypes.UUID, allowNull: false },
    slotId: { type: DataTypes.STRING },
    url: { type: DataTypes.TEXT, allowNull: false },
    caption: { type: DataTypes.STRING },
    isPrimary: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: 'property_images', indexes: [{ fields: ['property_id'] }] }
);

export default PropertyImage;
