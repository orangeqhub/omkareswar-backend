'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('visits', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      visit_code: { type: Sequelize.STRING, unique: true },
      property_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'properties', key: 'id' },
        onDelete: 'CASCADE',
      },
      buyer_id: { type: Sequelize.UUID, allowNull: false },
      seller_id: { type: Sequelize.UUID, allowNull: false },
      buyer_name: { type: Sequelize.STRING },
      scheduled_for: { type: Sequelize.DATE, allowNull: false },
      meeting_location: { type: Sequelize.STRING },
      status: {
        type: Sequelize.ENUM('scheduled', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'no_show'),
        defaultValue: 'scheduled',
      },
      outcome: { type: Sequelize.STRING },
      notes: { type: Sequelize.JSONB, defaultValue: [] },
      assigned_mediator_id: { type: Sequelize.UUID, allowNull: true },
      assigned_employee_id: { type: Sequelize.UUID, allowNull: true },
      assigned_by: { type: Sequelize.UUID, allowNull: true },
      assignment_note: { type: Sequelize.TEXT },
      assignment_due_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('visits', ['property_id']);
    await queryInterface.addIndex('visits', ['buyer_id']);
    await queryInterface.addIndex('visits', ['seller_id']);
    await queryInterface.addIndex('visits', ['status']);

    await queryInterface.createTable('visit_histories', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      visit_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'visits', key: 'id' },
        onDelete: 'CASCADE',
      },
      actor_id: { type: Sequelize.UUID, allowNull: false },
      action: { type: Sequelize.STRING, allowNull: false },
      note: { type: Sequelize.TEXT },
      status_after: { type: Sequelize.STRING },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('visit_histories', ['visit_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('visit_histories');
    await queryInterface.dropTable('visits');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_visits_status";');
  },
};
