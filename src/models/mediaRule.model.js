import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

// One media rule per ruleKey (e.g. apartment, residentialPlot, agriculturalLand).
// countBasedSlots (bedrooms*, bathrooms* etc) are stored as JSONB since they are
// a fixed structural template; commonSlots and allowedExtraSpaces are separate
// related tables so admins can add/remove individual entries.
const MediaRule = sequelize.define(
  'MediaRule',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    ruleKey: { type: DataTypes.STRING, allowNull: false, unique: true },
    countBasedSlots: { type: DataTypes.JSONB, defaultValue: [] },
  },
  { tableName: 'media_rules' }
);

export default MediaRule;
