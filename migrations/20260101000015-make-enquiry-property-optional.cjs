'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE enquiries
      ALTER COLUMN property_id DROP NOT NULL;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE enquiries
      ALTER COLUMN seller_id DROP NOT NULL;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DELETE FROM enquiries
      WHERE property_id IS NULL
         OR seller_id IS NULL;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE enquiries
      ALTER COLUMN property_id SET NOT NULL;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE enquiries
      ALTER COLUMN seller_id SET NOT NULL;
    `);
  },
};