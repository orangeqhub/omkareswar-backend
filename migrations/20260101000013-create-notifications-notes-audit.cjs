'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      audience_role: { type: Sequelize.STRING, allowNull: true },
      audience_user_id: { type: Sequelize.UUID, allowNull: true },
      type: { type: Sequelize.STRING, allowNull: false },
      related_type: { type: Sequelize.STRING },
      related_id: { type: Sequelize.UUID },
      title_en: { type: Sequelize.STRING, allowNull: false },
      title_te: { type: Sequelize.STRING },
      read: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('notifications', ['audience_user_id']);
    await queryInterface.addIndex('notifications', ['audience_role']);
    await queryInterface.addIndex('notifications', ['read']);

    await queryInterface.createTable('internal_notes', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      record_type: { type: Sequelize.STRING, allowNull: false },
      record_id: { type: Sequelize.UUID, allowNull: false },
      author_id: { type: Sequelize.UUID, allowNull: false },
      text: { type: Sequelize.TEXT, allowNull: false },
      visibility: { type: Sequelize.STRING, defaultValue: 'employee_admin' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('internal_notes', ['record_type', 'record_id']);

    await queryInterface.createTable('audit_logs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      action: { type: Sequelize.STRING, allowNull: false },
      actor_id: { type: Sequelize.UUID, allowNull: true },
      actor_role: { type: Sequelize.STRING },
      details: { type: Sequelize.JSONB, defaultValue: {} },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('audit_logs', ['action']);
    await queryInterface.addIndex('audit_logs', ['actor_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('internal_notes');
    await queryInterface.dropTable('notifications');
  },
};
