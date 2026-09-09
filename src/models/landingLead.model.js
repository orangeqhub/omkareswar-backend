import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const LandingLead = sequelize.define(
  'LandingLead',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    contact: { type: DataTypes.STRING(20), allowNull: false },
    cityVillage: { type: DataTypes.STRING(150) },
    role: { type: DataTypes.STRING(20), allowNull: false }, // buyer | seller | mediator
    source: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'landing_page' },
  },
  {
    tableName: 'landing_leads',
    indexes: [{ fields: ['created_at'] }, { fields: ['role'] }],
  }
);

export default LandingLead;