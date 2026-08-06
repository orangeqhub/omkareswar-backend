'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('media_rules', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      rule_key: { type: Sequelize.STRING, allowNull: false, unique: true },
      count_based_slots: { type: Sequelize.JSONB, defaultValue: [] },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('media_rule_common_slots', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      media_rule_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'media_rules', key: 'id' },
        onDelete: 'CASCADE',
      },
      slot_key: { type: Sequelize.STRING, allowNull: false },
      label_en: { type: Sequelize.STRING, allowNull: false },
      label_te: { type: Sequelize.STRING },
      required: { type: Sequelize.BOOLEAN, defaultValue: false },
      order: { type: Sequelize.INTEGER, defaultValue: 0 },
      max_file_size_mb: { type: Sequelize.INTEGER, defaultValue: 5 },
      allowed_extensions: { type: Sequelize.JSONB, defaultValue: ['jpg', 'jpeg', 'png', 'webp'] },
      caption_required: { type: Sequelize.BOOLEAN, defaultValue: false },
      primary_eligible: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('media_rule_extra_spaces', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      media_rule_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'media_rules', key: 'id' },
        onDelete: 'CASCADE',
      },
      key: { type: Sequelize.STRING, allowNull: false },
      label_en: { type: Sequelize.STRING, allowNull: false },
      label_te: { type: Sequelize.STRING },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('media_rule_extra_spaces');
    await queryInterface.dropTable('media_rule_common_slots');
    await queryInterface.dropTable('media_rules');
  },
};
