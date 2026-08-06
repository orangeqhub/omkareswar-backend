'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('enquiries', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      enquiry_code: { type: Sequelize.STRING, unique: true },
      property_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'properties', key: 'id' },
        onDelete: 'CASCADE',
      },
      seller_id: { type: Sequelize.UUID, allowNull: false },
      buyer_id: { type: Sequelize.UUID, allowNull: true },
      buyer_name: { type: Sequelize.STRING, allowNull: false },
      buyer_phone: { type: Sequelize.STRING, allowNull: false },
      message: { type: Sequelize.TEXT },
      channel: { type: Sequelize.STRING, defaultValue: 'whatsapp' },
      status: {
        type: Sequelize.ENUM('new', 'contacted', 'followup_required', 'visit_requested', 'closed'),
        defaultValue: 'new',
      },
      priority: { type: Sequelize.ENUM('low', 'medium', 'high'), defaultValue: 'medium' },
      next_follow_up_at: { type: Sequelize.DATE },
      assigned_employee_id: { type: Sequelize.UUID, allowNull: true },
      assigned_mediator_id: { type: Sequelize.UUID, allowNull: true },
      assigned_by: { type: Sequelize.UUID, allowNull: true },
      completed_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('enquiries', ['property_id']);
    await queryInterface.addIndex('enquiries', ['seller_id']);
    await queryInterface.addIndex('enquiries', ['status']);

    await queryInterface.createTable('call_notes', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      enquiry_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'enquiries', key: 'id' },
        onDelete: 'CASCADE',
      },
      created_by: { type: Sequelize.UUID, allowNull: false },
      call_date_time: { type: Sequelize.DATE, allowNull: false },
      direction: { type: Sequelize.ENUM('incoming', 'outgoing'), allowNull: false },
      result: { type: Sequelize.STRING },
      summary: { type: Sequelize.TEXT },
      interest_level: { type: Sequelize.ENUM('low', 'medium', 'high') },
      next_action: { type: Sequelize.STRING },
      next_follow_up_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('call_notes', ['enquiry_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('call_notes');
    await queryInterface.dropTable('enquiries');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_enquiries_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_enquiries_priority";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_call_notes_direction";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_call_notes_interest_level";');
  },
};
