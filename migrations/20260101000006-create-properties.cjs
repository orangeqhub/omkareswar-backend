'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('properties', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      property_code: { type: Sequelize.STRING, unique: true },
      category_slug: { type: Sequelize.STRING, allowNull: false },
      rule_key: { type: Sequelize.STRING },
      title_en: { type: Sequelize.STRING },
      title_te: { type: Sequelize.STRING },
      description_en: { type: Sequelize.TEXT },
      description_te: { type: Sequelize.TEXT },
      transaction_type: { type: Sequelize.STRING },
      price: { type: Sequelize.DECIMAL(14, 2) },
      price_negotiable: { type: Sequelize.BOOLEAN, defaultValue: false },
      area: { type: Sequelize.DECIMAL(14, 2) },
      area_unit: { type: Sequelize.STRING },
      state: { type: Sequelize.STRING },
      district: { type: Sequelize.STRING },
      city: { type: Sequelize.STRING },
      mandal: { type: Sequelize.STRING },
      village: { type: Sequelize.STRING },
      locality: { type: Sequelize.STRING },
      landmark: { type: Sequelize.STRING },
      pincode: { type: Sequelize.STRING },
      address: { type: Sequelize.TEXT },
      location_en: { type: Sequelize.STRING },
      location_te: { type: Sequelize.STRING },
      map_lat: { type: Sequelize.DECIMAL(10, 6) },
      map_lng: { type: Sequelize.DECIMAL(10, 6) },
      venture_name: { type: Sequelize.STRING },
      structure: { type: Sequelize.JSONB, defaultValue: {} },
      plot_details: { type: Sequelize.JSONB, defaultValue: {} },
      amenities: { type: Sequelize.JSONB, defaultValue: [] },
      contact_name: { type: Sequelize.STRING },
      contact_phone: { type: Sequelize.STRING },
      prefer_whatsapp: { type: Sequelize.BOOLEAN, defaultValue: true },
      prefer_call: { type: Sequelize.BOOLEAN, defaultValue: true },
      hide_phone: { type: Sequelize.BOOLEAN, defaultValue: false },
      status: {
        type: Sequelize.ENUM('draft', 'pending', 'active', 'rejected', 'changes_requested', 'sold', 'inactive'),
        allowNull: false,
        defaultValue: 'draft',
      },
      moderation_status: {
        type: Sequelize.ENUM(
          'submitted',
          'in_review',
          'changes_requested',
          'recommended_approval',
          'recommended_rejection',
          'completed'
        ),
        allowNull: true,
      },
      moderation_note: { type: Sequelize.TEXT },
      verified: { type: Sequelize.BOOLEAN, defaultValue: false },
      featured: { type: Sequelize.BOOLEAN, defaultValue: false },
      views: { type: Sequelize.INTEGER, defaultValue: 0 },
      seller_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      assigned_employee_id: { type: Sequelize.UUID, allowNull: true },
      assigned_mediator_id: { type: Sequelize.UUID, allowNull: true },
      assigned_by: { type: Sequelize.UUID, allowNull: true },
      assigned_at: { type: Sequelize.DATE },
      priority: { type: Sequelize.STRING, defaultValue: 'medium' },
      due_date: { type: Sequelize.DATE },
      posted_date: { type: Sequelize.DATE },
      updated_date: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('properties', ['category_slug']);
    await queryInterface.addIndex('properties', ['status']);
    await queryInterface.addIndex('properties', ['seller_id']);
    await queryInterface.addIndex('properties', ['city']);
    await queryInterface.addIndex('properties', ['transaction_type']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('properties');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_properties_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_properties_moderation_status";');
  },
};
