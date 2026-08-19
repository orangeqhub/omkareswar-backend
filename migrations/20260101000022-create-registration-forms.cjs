'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('registration_forms', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      form_type: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      description: { type: Sequelize.TEXT },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('registration_fields', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      registration_form_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'registration_forms', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      field_key: { type: Sequelize.STRING(64), allowNull: false },
      label: { type: Sequelize.STRING(120), allowNull: false },
      field_type: { type: Sequelize.STRING(20), allowNull: false },
      placeholder: { type: Sequelize.STRING(255) },
      help_text: { type: Sequelize.TEXT },
      default_value: { type: Sequelize.JSONB },
      validation_rules: { type: Sequelize.JSONB, defaultValue: {} },
      options: { type: Sequelize.JSONB },
      is_required: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      is_system_field: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      display_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('registration_fields', ['registration_form_id']);
    await queryInterface.addIndex('registration_fields', ['display_order']);
    await queryInterface.addIndex('registration_fields', ['registration_form_id', 'field_key'], {
      unique: true,
      name: 'registration_fields_form_key_unique',
    });

    await queryInterface.addColumn('users', 'custom_fields', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {},
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'custom_fields');
    await queryInterface.dropTable('registration_fields');
    await queryInterface.dropTable('registration_forms');
  },
};
