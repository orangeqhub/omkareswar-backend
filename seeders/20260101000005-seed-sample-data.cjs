'use strict';
const crypto = require('crypto');

async function getUserIdByMobile(queryInterface, mobile) {
  const [rows] = await queryInterface.sequelize.query('SELECT id FROM users WHERE mobile = :mobile', {
    replacements: { mobile },
  });
  return rows[0]?.id;
}

module.exports = {
  up: async (queryInterface) => {
    const sellerId = await getUserIdByMobile(queryInterface, '9000000003');
    const buyerId = await getUserIdByMobile(queryInterface, '9000000004');
    const mediatorId = await getUserIdByMobile(queryInterface, '9000000005');
    const [employeeRows] = await queryInterface.sequelize.query("SELECT id FROM users WHERE member_id = 'EMP-2026-0001'");
    const employeeId = employeeRows[0]?.id;
    const [adminRows] = await queryInterface.sequelize.query("SELECT id FROM users WHERE login_id = 'ADMIN001'");
    const adminId = adminRows[0]?.id;

    if (!sellerId || !buyerId) return; // users seeder must run first

    const [existingProps] = await queryInterface.sequelize.query("SELECT id FROM properties WHERE property_code = 'PROP-2026-000001'");
    let propertyId;

    if (!existingProps.length) {
      propertyId = crypto.randomUUID();
      const property2Id = crypto.randomUUID();

      await queryInterface.bulkInsert('properties', [
        {
          id: propertyId,
          property_code: 'PROP-2026-000001',
          category_slug: 'apartments',
          rule_key: 'apartment',
          title_en: '3BHK Premium Apartment in Gachibowli',
          title_te: 'గచ్చిబౌలిలో 3BHK ప్రీమియం అపార్ట్‌మెంట్',
          description_en: 'Spacious 3BHK apartment with modern amenities, close to IT hub.',
          transaction_type: 'sale',
          price: 8500000,
          price_negotiable: true,
          area: 1850,
          area_unit: 'sqft',
          state: 'Telangana',
          district: 'Hyderabad',
          city: 'Hyderabad',
          locality: 'Gachibowli',
          address: 'Plot 45, Gachibowli, Hyderabad',
          location_en: 'Gachibowli, Hyderabad',
          structure: JSON.stringify({ bedrooms: 3, bathrooms: 3, halls: 1, kitchens: 1, furnishing: 'semi', facing: 'East', parking: 2 }),
          amenities: JSON.stringify(['Lift', 'Power Backup', 'Gym', 'Swimming Pool']),
          contact_name: 'Ramesh Kumar',
          contact_phone: '9000000003',
          prefer_whatsapp: true,
          prefer_call: true,
          status: 'active',
          moderation_status: 'completed',
          verified: true,
          featured: true,
          views: 42,
          seller_id: sellerId,
          assigned_employee_id: employeeId,
          posted_date: new Date(),
          updated_date: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: property2Id,
          property_code: 'PROP-2026-000002',
          category_slug: 'residential-plots',
          rule_key: 'residentialPlot',
          title_en: 'Open Residential Plot near Shamshabad',
          description_en: 'DTCP approved open plot, ready for construction.',
          transaction_type: 'sale',
          price: 3200000,
          area: 267,
          area_unit: 'sqyd',
          state: 'Telangana',
          district: 'Ranga Reddy',
          city: 'Shamshabad',
          locality: 'Adibatla',
          address: 'Survey No 120, Adibatla, Shamshabad',
          plot_details: JSON.stringify({ facing: 'North', boundary: 'Compound Wall', approvals: ['DTCP'] }),
          contact_name: 'Ramesh Kumar',
          contact_phone: '9000000003',
          status: 'pending',
          moderation_status: 'submitted',
          verified: false,
          featured: false,
          views: 5,
          seller_id: sellerId,
          assigned_employee_id: employeeId,
          posted_date: new Date(),
          updated_date: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      await queryInterface.bulkInsert('property_images', [
        {
          id: crypto.randomUUID(),
          property_id: propertyId,
          slot_id: 'buildingExterior',
          url: '/uploads/properties/sample-apartment-exterior.jpg',
          is_primary: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    } else {
      propertyId = existingProps[0].id;
    }

    // Enquiry
    const [existingEnq] = await queryInterface.sequelize.query("SELECT id FROM enquiries WHERE enquiry_code = 'ENQ-2026-000001'");
    let enquiryId;
    if (!existingEnq.length) {
      enquiryId = crypto.randomUUID();
      await queryInterface.bulkInsert('enquiries', [
        {
          id: enquiryId,
          enquiry_code: 'ENQ-2026-000001',
          property_id: propertyId,
          seller_id: sellerId,
          buyer_id: buyerId,
          buyer_name: 'Anita Reddy',
          buyer_phone: '9000000004',
          message: 'Interested in this property, please share more details.',
          channel: 'whatsapp',
          status: 'new',
          priority: 'medium',
          assigned_employee_id: employeeId,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    } else {
      enquiryId = existingEnq[0].id;
    }

    // Visit
    const [existingVisit] = await queryInterface.sequelize.query("SELECT id FROM visits WHERE visit_code = 'VIS-2026-000001'");
    if (!existingVisit.length) {
      const scheduledFor = new Date();
      scheduledFor.setDate(scheduledFor.getDate() + 2);
      await queryInterface.bulkInsert('visits', [
        {
          id: crypto.randomUUID(),
          visit_code: 'VIS-2026-000001',
          property_id: propertyId,
          buyer_id: buyerId,
          seller_id: sellerId,
          buyer_name: 'Anita Reddy',
          scheduled_for: scheduledFor,
          meeting_location: 'Property site, Gachibowli',
          status: 'scheduled',
          assigned_mediator_id: mediatorId,
          assigned_employee_id: employeeId,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    // Follow-up
    const [existingFollowUp] = await queryInterface.sequelize.query(
      "SELECT id FROM follow_ups WHERE record_type = 'enquiry' AND record_id = :enquiryId",
      { replacements: { enquiryId } }
    );
    if (!existingFollowUp.length && employeeId && adminId) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1);
      await queryInterface.bulkInsert('follow_ups', [
        {
          id: crypto.randomUUID(),
          record_type: 'enquiry',
          record_id: enquiryId,
          assigned_employee_id: employeeId,
          assigned_by: adminId,
          due_date: dueDate.toISOString().slice(0, 10),
          due_time: '11:00',
          priority: 'high',
          reason: 'Call buyer to confirm visit schedule',
          next_action: 'Call buyer',
          status: 'assigned',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    // Notifications
    const [existingNotif] = await queryInterface.sequelize.query("SELECT id FROM notifications WHERE type = 'seed.welcome'");
    if (!existingNotif.length) {
      await queryInterface.bulkInsert('notifications', [
        {
          id: crypto.randomUUID(),
          audience_role: 'admin',
          type: 'seed.welcome',
          related_type: 'system',
          title_en: 'Welcome to OMKARESWAR REALTORS admin panel',
          title_te: 'ఓంకారేశ్వర రియల్టర్స్ అడ్మిన్ ప్యానెల్‌కు స్వాగతం',
          read: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: crypto.randomUUID(),
          audience_user_id: sellerId,
          type: 'seed.welcome',
          related_type: 'system',
          title_en: 'Welcome! Your seller account is active.',
          title_te: 'స్వాగతం! మీ విక్రేత ఖాతా యాక్టివ్‌గా ఉంది.',
          read: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    // Seed counters so that live-generated IDs don't collide with the fixed
    // IDs used above.
    const counters = [
      { key: 'ADM-2026', value: 1 },
      { key: 'EMP-2026', value: 1 },
      { key: 'BUY-2026', value: 1 },
      { key: 'SEL-2026', value: 1 },
      { key: 'MED-2026', value: 1 },
      { key: 'REG-2026', value: 4 },
      { key: 'PROP-2026', value: 2 },
      { key: 'ENQ-2026', value: 1 },
      { key: 'VIS-2026', value: 1 },
    ];
    for (const c of counters) {
      const [rows] = await queryInterface.sequelize.query('SELECT id FROM counters WHERE key = :key', { replacements: { key: c.key } });
      if (!rows.length) {
        await queryInterface.bulkInsert('counters', [{ key: c.key, value: c.value, created_at: new Date(), updated_at: new Date() }]);
      }
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('notifications', { type: 'seed.welcome' });
    await queryInterface.bulkDelete('follow_ups', null, {});
    await queryInterface.bulkDelete('visits', { visit_code: 'VIS-2026-000001' });
    await queryInterface.bulkDelete('enquiries', { enquiry_code: 'ENQ-2026-000001' });
    await queryInterface.bulkDelete('properties', { property_code: ['PROP-2026-000001', 'PROP-2026-000002'] });
  },
};
