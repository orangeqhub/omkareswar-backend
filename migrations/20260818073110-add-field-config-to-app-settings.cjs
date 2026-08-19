'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('app_settings', 'field_config', {
      type: Sequelize.JSON,
      defaultValue: {},
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('app_settings', 'field_config');
  },
};
