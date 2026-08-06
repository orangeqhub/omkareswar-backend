import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const VisitHistory = sequelize.define(
  'VisitHistory',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    visitId: { type: DataTypes.UUID, allowNull: false },
    actorId: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.STRING, allowNull: false },
    note: { type: DataTypes.TEXT },
    statusAfter: { type: DataTypes.STRING },
  },
  { tableName: 'visit_histories', indexes: [{ fields: ['visit_id'] }] }
);

export default VisitHistory;
