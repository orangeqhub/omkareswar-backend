import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    action: { type: DataTypes.STRING, allowNull: false }, // dotted string e.g. 'registration.approve'
    actorId: { type: DataTypes.UUID, allowNull: true },
    actorRole: { type: DataTypes.STRING },
    details: { type: DataTypes.JSONB, defaultValue: {} },
  },
  { tableName: 'audit_logs', indexes: [{ fields: ['action'] }, { fields: ['actor_id'] }] }
);

export default AuditLog;
