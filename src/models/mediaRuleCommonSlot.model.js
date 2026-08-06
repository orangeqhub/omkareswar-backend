import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MediaRuleCommonSlot = sequelize.define(
  'MediaRuleCommonSlot',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    mediaRuleId: { type: DataTypes.UUID, allowNull: false },
    slotKey: { type: DataTypes.STRING, allowNull: false }, // e.g. buildingExterior, frontView
    labelEn: { type: DataTypes.STRING, allowNull: false },
    labelTe: { type: DataTypes.STRING },
    required: { type: DataTypes.BOOLEAN, defaultValue: false },
    order: { type: DataTypes.INTEGER, defaultValue: 0 },
    maxFileSizeMb: { type: DataTypes.INTEGER, defaultValue: 5 },
    allowedExtensions: { type: DataTypes.JSONB, defaultValue: ['jpg', 'jpeg', 'png', 'webp'] },
    captionRequired: { type: DataTypes.BOOLEAN, defaultValue: false },
    primaryEligible: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: 'media_rule_common_slots' }
);

export default MediaRuleCommonSlot;
