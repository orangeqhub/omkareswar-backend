import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

// Backing table for src/utils/idGenerator.js sequential ID generation.
const Counter = sequelize.define(
  'Counter',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    key: { type: DataTypes.STRING, allowNull: false, unique: true }, // e.g. PROP-2026
    value: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { tableName: 'counters' }
);

export default Counter;
