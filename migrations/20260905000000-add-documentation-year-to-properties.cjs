'use strict';

/**
 * Adds a year-of-preparation field for the Link Document entered by the
 * seller in the listing wizard.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('properties', 'documentation_year', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('properties', 'documentation_year');
  },
};