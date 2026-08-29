'use strict';

/**
 * Adds a per-visit counter to recently_viewed_properties so repeated visits
 * to the same listing count towards location-interest notifications.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('recently_viewed_properties', 'view_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('recently_viewed_properties', 'view_count');
  },
};