'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('property_moderation_histories', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      property_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'properties', key: 'id' },
        onDelete: 'CASCADE',
      },
      actor_id: { type: Sequelize.UUID, allowNull: false },
      action: { type: Sequelize.STRING, allowNull: false },
      note: { type: Sequelize.TEXT },
      fields: { type: Sequelize.JSONB, defaultValue: [] },
      slots: { type: Sequelize.JSONB, defaultValue: [] },
      status_after: { type: Sequelize.STRING },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('property_moderation_histories', ['property_id']);

    await queryInterface.createTable('user_correction_histories', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      actor_id: { type: Sequelize.UUID, allowNull: false },
      action: { type: Sequelize.STRING, allowNull: false },
      reason: { type: Sequelize.TEXT },
      fields: { type: Sequelize.JSONB, defaultValue: [] },
      status_after: { type: Sequelize.STRING },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('user_correction_histories', ['user_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('user_correction_histories');
    await queryInterface.dropTable('property_moderation_histories');
  },
};
