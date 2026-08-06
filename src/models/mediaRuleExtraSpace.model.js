import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MediaRuleExtraSpace = sequelize.define(
  'MediaRuleExtraSpace',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    mediaRuleId: { type: DataTypes.UUID, allowNull: false },
    key: { type: DataTypes.STRING, allowNull: false }, // e.g. poojaRoom, borewell
    labelEn: { type: DataTypes.STRING, allowNull: false },
    labelTe: { type: DataTypes.STRING },
  },
  { tableName: 'media_rule_extra_spaces' }
);

export default MediaRuleExtraSpace;
