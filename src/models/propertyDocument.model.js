import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PropertyDocument = sequelize.define(
  'PropertyDocument',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    propertyId: { type: DataTypes.UUID, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false }, // identity_proof | ownership_proof
    url: { type: DataTypes.TEXT, allowNull: false },
    originalName: { type: DataTypes.STRING },
  },
  { tableName: 'property_documents', indexes: [{ fields: ['property_id'] }] }
);

export default PropertyDocument;
