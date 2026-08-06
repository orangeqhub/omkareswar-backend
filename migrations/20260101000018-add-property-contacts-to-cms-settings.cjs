'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('cms_settings', 'property_contact_phone', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('cms_settings', 'property_contact_whatsapp', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('cms_settings', 'property_contact_phone');
    await queryInterface.removeColumn('cms_settings', 'property_contact_whatsapp');
  },
};
