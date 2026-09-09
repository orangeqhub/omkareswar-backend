'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('landing_leads', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: { type: Sequelize.STRING(255), allowNull: false },
      contact: { type: Sequelize.STRING(20), allowNull: false },
      city_village: { type: Sequelize.STRING(150), allowNull: true },
      role: { type: Sequelize.STRING(20), allowNull: false },
      source: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'landing_page',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('landing_leads', ['created_at'], { name: 'landing_leads_created_at' });
    await queryInterface.addIndex('landing_leads', ['role'], { name: 'landing_leads_role' });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('landing_leads');
  },
};