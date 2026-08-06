'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('cms_settings', 'social_facebook', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('cms_settings', 'social_instagram', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('cms_settings', 'social_twitter', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('cms_settings', 'social_youtube', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('cms_settings', 'social_facebook');
    await queryInterface.removeColumn('cms_settings', 'social_instagram');
    await queryInterface.removeColumn('cms_settings', 'social_twitter');
    await queryInterface.removeColumn('cms_settings', 'social_youtube');
  },
};
