'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('categories', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      slug: { type: Sequelize.STRING, allowNull: false, unique: true },
      rule_key: { type: Sequelize.STRING, allowNull: false },
      name_en: { type: Sequelize.STRING, allowNull: false },
      name_te: { type: Sequelize.STRING },
      description_en: { type: Sequelize.TEXT },
      description_te: { type: Sequelize.TEXT },
      image: { type: Sequelize.STRING },
      icon: { type: Sequelize.STRING },
      transaction_types: { type: Sequelize.JSONB, defaultValue: [] },
      area_units: { type: Sequelize.JSONB, defaultValue: [] },
      property_fields: { type: Sequelize.JSONB, defaultValue: {} },
      active: { type: Sequelize.BOOLEAN, defaultValue: true },
      visible: { type: Sequelize.BOOLEAN, defaultValue: true },
      order: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('categories');
  },
};
