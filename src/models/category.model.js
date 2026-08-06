import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Category = sequelize.define(
  'Category',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    ruleKey: { type: DataTypes.STRING, allowNull: false },
    nameEn: { type: DataTypes.STRING, allowNull: false },
    nameTe: { type: DataTypes.STRING },
    descriptionEn: { type: DataTypes.TEXT },
    descriptionTe: { type: DataTypes.TEXT },
    image: { type: DataTypes.STRING },
    icon: { type: DataTypes.STRING },
    transactionTypes: { type: DataTypes.JSONB, defaultValue: [] },
    areaUnits: { type: DataTypes.JSONB, defaultValue: [] },
    propertyFields: { type: DataTypes.JSONB, defaultValue: {} },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    visible: { type: DataTypes.BOOLEAN, defaultValue: true },
    order: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  { tableName: 'categories' }
);

export default Category;
