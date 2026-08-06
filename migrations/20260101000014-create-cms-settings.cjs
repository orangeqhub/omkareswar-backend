'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('cms_settings', {
      id: { type: Sequelize.INTEGER, primaryKey: true, defaultValue: 1 },
      about_en: { type: Sequelize.TEXT },
      about_te: { type: Sequelize.TEXT },
      disclaimer_en: { type: Sequelize.TEXT },
      disclaimer_te: { type: Sequelize.TEXT },
      contact_phone: { type: Sequelize.STRING },
      contact_whatsapp: { type: Sequelize.STRING },
      contact_email: { type: Sequelize.STRING },
      contact_address_en: { type: Sequelize.TEXT },
      contact_address_te: { type: Sequelize.TEXT },
      contact_landmark_en: { type: Sequelize.STRING },
      contact_landmark_te: { type: Sequelize.STRING },
      contact_map_url: { type: Sequelize.STRING },
      business_hours_weekday_en: { type: Sequelize.STRING },
      business_hours_weekday_te: { type: Sequelize.STRING },
      business_hours_sunday_en: { type: Sequelize.STRING },
      business_hours_sunday_te: { type: Sequelize.STRING },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('app_settings', {
      id: { type: Sequelize.INTEGER, primaryKey: true, defaultValue: 1 },
      auto_approve_registrations: { type: Sequelize.BOOLEAN, defaultValue: false },
      auto_approve_properties: { type: Sequelize.BOOLEAN, defaultValue: false },
      max_image_size_mb: { type: Sequelize.INTEGER, defaultValue: 5 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('commissions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      property_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'properties', key: 'id' },
        onDelete: 'CASCADE',
      },
      mediator_id: { type: Sequelize.UUID, allowNull: true },
      employee_id: { type: Sequelize.UUID, allowNull: true },
      amount: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      status: { type: Sequelize.ENUM('pending', 'approved', 'paid'), defaultValue: 'pending' },
      note: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('commissions', ['property_id']);
    await queryInterface.addIndex('commissions', ['mediator_id']);

    await queryInterface.createTable('recently_viewed_properties', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      property_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'properties', key: 'id' },
        onDelete: 'CASCADE',
      },
      viewed_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('recently_viewed_properties', ['user_id', 'property_id'], { unique: true });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('recently_viewed_properties');
    await queryInterface.dropTable('commissions');
    await queryInterface.dropTable('app_settings');
    await queryInterface.dropTable('cms_settings');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_commissions_status";');
  },
};
