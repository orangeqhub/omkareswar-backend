'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      role: { type: Sequelize.ENUM('admin', 'employee', 'buyer', 'seller', 'mediator'), allowNull: false },
      member_id: { type: Sequelize.STRING, unique: true },
      registration_id: { type: Sequelize.STRING, unique: true },
      login_id: { type: Sequelize.STRING, unique: true },
      name: { type: Sequelize.STRING, allowNull: false },
      mobile: { type: Sequelize.STRING, unique: true },
      alt_mobile: { type: Sequelize.STRING },
      email: { type: Sequelize.STRING },
      password_hash: { type: Sequelize.STRING },
      profile_image: { type: Sequelize.STRING },
      district: { type: Sequelize.STRING },
      city: { type: Sequelize.STRING },
      address: { type: Sequelize.TEXT },
      role_detail: { type: Sequelize.JSONB, defaultValue: {} },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'correction_requested', 'active', 'inactive'),
        allowNull: false,
        defaultValue: 'pending',
      },
      permissions: { type: Sequelize.JSONB, defaultValue: [] },
      assigned_mediator_id: { type: Sequelize.UUID, allowNull: true },
      assigned_employee_id: { type: Sequelize.UUID, allowNull: true },
      rejection_reason: { type: Sequelize.TEXT },
      correction_reason: { type: Sequelize.TEXT },
      correction_fields: { type: Sequelize.JSONB, defaultValue: [] },
      approved_by: { type: Sequelize.UUID, allowNull: true },
      approved_at: { type: Sequelize.DATE },
      verification_status: {
        type: Sequelize.ENUM(
          'pending_review',
          'in_review',
          'correction_requested',
          'recommended_approval',
          'recommended_rejection',
          'completed'
        ),
        defaultValue: 'pending_review',
      },
      last_login_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['status']);
    await queryInterface.addIndex('users', ['mobile']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('users');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_verification_status";');
  },
};
