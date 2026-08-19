'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('app_settings', 'property_fields', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
    });
    await queryInterface.addColumn('properties', 'dynamic_fields', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {},
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('app_settings', 'property_fields');
    await queryInterface.removeColumn('properties', 'dynamic_fields');
  },
};
