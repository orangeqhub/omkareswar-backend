'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('follow_ups', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      record_type: { type: Sequelize.ENUM('enquiry', 'userVerification', 'property', 'visit'), allowNull: false },
      record_id: { type: Sequelize.UUID, allowNull: false },
      assigned_employee_id: { type: Sequelize.UUID, allowNull: false },
      assigned_by: { type: Sequelize.UUID, allowNull: false },
      due_date: { type: Sequelize.DATEONLY, allowNull: false },
      due_time: { type: Sequelize.STRING },
      priority: { type: Sequelize.ENUM('low', 'medium', 'high'), defaultValue: 'medium' },
      reason: { type: Sequelize.TEXT },
      next_action: { type: Sequelize.STRING },
      status: { type: Sequelize.ENUM('assigned', 'in_progress', 'completed', 'cancelled'), defaultValue: 'assigned' },
      completion_note: { type: Sequelize.TEXT },
      notes: { type: Sequelize.JSONB, defaultValue: [] },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('follow_ups', ['assigned_employee_id']);
    await queryInterface.addIndex('follow_ups', ['status']);
    await queryInterface.addIndex('follow_ups', ['record_type', 'record_id']);

    await queryInterface.createTable('follow_up_histories', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      follow_up_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'follow_ups', key: 'id' },
        onDelete: 'CASCADE',
      },
      actor_id: { type: Sequelize.UUID, allowNull: false },
      action: { type: Sequelize.STRING, allowNull: false },
      note: { type: Sequelize.TEXT },
      status_after: { type: Sequelize.STRING },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('follow_up_histories', ['follow_up_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('follow_up_histories');
    await queryInterface.dropTable('follow_ups');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_follow_ups_record_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_follow_ups_priority";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_follow_ups_status";');
  },
};
