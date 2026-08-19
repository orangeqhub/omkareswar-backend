'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('properties', 'village_name', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('properties', 'survey_number', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('properties', 'acres', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('properties', 'acre_valuation', {
      type: Sequelize.DECIMAL(14, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('properties', 'total_sale_value', {
      type: Sequelize.DECIMAL(14, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('properties', 'conversion', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
    await queryInterface.addColumn('properties', 'passbook', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('properties', 'adangal', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('properties', 'rsr_copy', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('properties', 'documentation_number', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('properties', 'land_document_history', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('properties', 'owner_name', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('properties', 'town', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('properties', 'street', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('properties', 'road_facing', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('properties', 'plot_facing', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('properties', 'lift_facility', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
    await queryInterface.addColumn('properties', 'built_up_area', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('properties', 'ground_square_yards', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('properties', 'facing', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('properties', 'village_name');
    await queryInterface.removeColumn('properties', 'survey_number');
    await queryInterface.removeColumn('properties', 'acres');
    await queryInterface.removeColumn('properties', 'acre_valuation');
    await queryInterface.removeColumn('properties', 'total_sale_value');
    await queryInterface.removeColumn('properties', 'conversion');
    await queryInterface.removeColumn('properties', 'passbook');
    await queryInterface.removeColumn('properties', 'adangal');
    await queryInterface.removeColumn('properties', 'rsr_copy');
    await queryInterface.removeColumn('properties', 'documentation_number');
    await queryInterface.removeColumn('properties', 'land_document_history');
    await queryInterface.removeColumn('properties', 'owner_name');
    await queryInterface.removeColumn('properties', 'town');
    await queryInterface.removeColumn('properties', 'street');
    await queryInterface.removeColumn('properties', 'road_facing');
    await queryInterface.removeColumn('properties', 'plot_facing');
    await queryInterface.removeColumn('properties', 'lift_facility');
    await queryInterface.removeColumn('properties', 'built_up_area');
    await queryInterface.removeColumn('properties', 'ground_square_yards');
    await queryInterface.removeColumn('properties', 'facing');
  }
};
