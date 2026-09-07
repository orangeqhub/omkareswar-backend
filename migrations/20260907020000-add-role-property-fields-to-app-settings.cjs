'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('app_settings', 'property_fields_by_role', {
      type: Sequelize.JSON,
      defaultValue: {},
      allowNull: true,
    });
    await queryInterface.addColumn('app_settings', 'field_config_by_role', {
      type: Sequelize.JSON,
      defaultValue: {},
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('app_settings', 'field_config_by_role');
    await queryInterface.removeColumn('app_settings', 'property_fields_by_role');
  },
};