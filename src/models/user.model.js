import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

// Unified user table for admin / employee / buyer / seller / mediator.
// Registration workflow lives here too: a new public user starts as
// role=buyer|seller|mediator, status=pending, registrationId set, and
// memberId is generated only once approved.
const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    role: {
      type: DataTypes.ENUM('admin', 'employee', 'buyer', 'seller', 'mediator'),
      allowNull: false,
    },
    memberId: { type: DataTypes.STRING, unique: true }, // ADM-/EMP-/BUY-/SEL-/MED-YYYY-000001
    registrationId: { type: DataTypes.STRING, unique: true }, // REG-YYYY-000001
    loginId: { type: DataTypes.STRING, unique: true }, // admin login id
    name: { type: DataTypes.STRING, allowNull: false },
    mobile: { type: DataTypes.STRING, unique: true },
    altMobile: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING },
    passwordHash: { type: DataTypes.STRING },
    tempPassword: { type: DataTypes.STRING }, // plaintext password, admin-visible only
    profileImage: { type: DataTypes.STRING },
    district: { type: DataTypes.STRING },
    city: { type: DataTypes.STRING },
    address: { type: DataTypes.TEXT },
    roleDetail: { type: DataTypes.JSONB, defaultValue: {} }, // extra role-specific registration fields
    customFields: { type: DataTypes.JSONB, defaultValue: {} }, // CMS-defined dynamic registration values
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'correction_requested', 'active', 'inactive'),
      allowNull: false,
      defaultValue: 'pending',
    },
    permissions: { type: DataTypes.JSONB, defaultValue: [] }, // employee only
    assignedMediatorId: { type: DataTypes.UUID, allowNull: true }, // buyer/seller -> mediator FK
    assignedEmployeeId: { type: DataTypes.UUID, allowNull: true }, // registration reviewer FK
    rejectionReason: { type: DataTypes.TEXT },
    correctionReason: { type: DataTypes.TEXT },
    correctionFields: { type: DataTypes.JSONB, defaultValue: [] },
    approvedBy: { type: DataTypes.UUID, allowNull: true },
    approvedAt: { type: DataTypes.DATE },
    verificationStatus: {
      type: DataTypes.ENUM(
        'pending_review',
        'in_review',
        'correction_requested',
        'recommended_approval',
        'recommended_rejection',
        'completed'
      ),
      defaultValue: 'pending_review',
    },
    lastLoginAt: { type: DataTypes.DATE },
  },
  {
    tableName: 'users',
    indexes: [{ fields: ['role'] }, { fields: ['status'] }, { fields: ['mobile'] }],
  }
);

export default User;
