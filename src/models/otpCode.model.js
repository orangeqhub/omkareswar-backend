import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OtpCode = sequelize.define(
  'OtpCode',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    mobile: { type: DataTypes.STRING, allowNull: false },
    code: { type: DataTypes.STRING, allowNull: false },
    purpose: { type: DataTypes.STRING, allowNull: false, defaultValue: 'login' }, // login | registration
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    consumed: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: 'otp_codes', indexes: [{ fields: ['mobile'] }] }
);

export default OtpCode;
