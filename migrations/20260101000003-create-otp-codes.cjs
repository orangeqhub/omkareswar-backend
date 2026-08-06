'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('otp_codes', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      mobile: { type: Sequelize.STRING, allowNull: false },
      code: { type: Sequelize.STRING, allowNull: false },
      purpose: { type: Sequelize.STRING, allowNull: false, defaultValue: 'login' },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      consumed: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('otp_codes', ['mobile']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('otp_codes');
  },
};
