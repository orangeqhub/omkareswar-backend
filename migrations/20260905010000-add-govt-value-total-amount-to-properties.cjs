'use strict';

/**
 * Adds Government Value and auto-calculated Total Amount fields
 * entered by the seller in the listing wizard.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('properties', 'govt_value', {
      type: Sequelize.DECIMAL(14, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('properties', 'total_amount', {
      type: Sequelize.DECIMAL(14, 2),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('properties', 'total_amount');
    await queryInterface.removeColumn('properties', 'govt_value');
  },
};