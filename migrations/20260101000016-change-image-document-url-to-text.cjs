'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('property_images', 'url', {
      type: Sequelize.TEXT,
      allowNull: false,
    });
    await queryInterface.changeColumn('property_documents', 'url', {
      type: Sequelize.TEXT,
      allowNull: false,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('property_images', 'url', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.changeColumn('property_documents', 'url', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
