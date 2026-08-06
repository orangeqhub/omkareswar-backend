'use strict';
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function upsertUser(queryInterface, data) {
  const [existing] = await queryInterface.sequelize.query(
    `SELECT id FROM users WHERE mobile = :mobile OR login_id = :loginId OR member_id = :memberId LIMIT 1`,
    { replacements: { mobile: data.mobile || null, loginId: data.login_id || null, memberId: data.member_id || null } }
  );
  if (existing.length) return;

  await queryInterface.bulkInsert('users', [
    {
      id: crypto.randomUUID(),
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
}

module.exports = {
  up: async (queryInterface) => {
    const adminPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'Admin@123', 10);
    const employeePassword = await bcrypt.hash('Employee@123', 10);

    await upsertUser(queryInterface, {
      role: 'admin',
      member_id: 'ADM-2026-000001',
      login_id: process.env.SEED_ADMIN_LOGIN_ID || 'ADMIN001',
      name: 'Site Administrator',
      mobile: '9000000001',
      email: 'admin@omkareswarrealtors.com',
      password_hash: adminPassword,
      city: 'Hyderabad',
      district: 'Hyderabad',
      status: 'active',
      permissions: JSON.stringify([]),
    });

    await upsertUser(queryInterface, {
      role: 'employee',
      member_id: 'EMP-2026-0001',
      name: 'Priya Sharma',
      mobile: '9000000002',
      email: 'priya.employee@omkareswarrealtors.com',
      password_hash: employeePassword,
      city: 'Hyderabad',
      district: 'Hyderabad',
      status: 'active',
      permissions: JSON.stringify([
        'EMPLOYEE_DASHBOARD_VIEW',
        'USER_VERIFICATION_VIEW',
        'USER_VERIFICATION_RECOMMEND',
        'USER_VERIFICATION_CORRECTION_REQUEST',
        'PROPERTY_MODERATION_VIEW',
        'PROPERTY_MODERATION_RECOMMEND',
        'PROPERTY_MODERATION_CORRECTION_REQUEST',
        'ENQUIRY_VIEW',
        'ENQUIRY_UPDATE',
        'CALL_NOTES_MANAGE',
        'VISIT_VIEW',
        'VISIT_UPDATE',
        'FOLLOWUP_VIEW',
        'FOLLOWUP_MANAGE',
        'NOTIFICATIONS_VIEW',
        'INTERNAL_NOTES_VIEW',
        'INTERNAL_NOTES_MANAGE',
        'REPORTS_VIEW',
      ]),
    });

    await upsertUser(queryInterface, {
      role: 'seller',
      member_id: 'SEL-2026-000001',
      registration_id: 'REG-2026-000001',
      name: 'Ramesh Kumar',
      mobile: '9000000003',
      email: 'ramesh.seller@example.com',
      city: 'Hyderabad',
      district: 'Hyderabad',
      address: 'Plot 12, Jubilee Hills',
      status: 'approved',
      verification_status: 'completed',
      permissions: JSON.stringify([]),
    });

    await upsertUser(queryInterface, {
      role: 'buyer',
      member_id: 'BUY-2026-000001',
      registration_id: 'REG-2026-000002',
      name: 'Anita Reddy',
      mobile: '9000000004',
      email: 'anita.buyer@example.com',
      city: 'Hyderabad',
      district: 'Hyderabad',
      address: 'Flat 402, Gachibowli',
      status: 'approved',
      verification_status: 'completed',
      permissions: JSON.stringify([]),
    });

    await upsertUser(queryInterface, {
      role: 'mediator',
      member_id: 'MED-2026-000001',
      registration_id: 'REG-2026-000003',
      name: 'Suresh Babu',
      mobile: '9000000005',
      email: 'suresh.mediator@example.com',
      city: 'Hyderabad',
      district: 'Hyderabad',
      address: '5-6-7, Mediator Colony',
      status: 'approved',
      verification_status: 'completed',
      permissions: JSON.stringify([]),
    });

    // A second pending seller registration to demonstrate the approval workflow.
    await upsertUser(queryInterface, {
      role: 'seller',
      registration_id: 'REG-2026-000004',
      name: 'Lakshmi Narayana',
      mobile: '9000000006',
      email: 'lakshmi.pending@example.com',
      city: 'Vijayawada',
      district: 'Krishna',
      address: 'Door No 10-2, Governorpet',
      status: 'pending',
      verification_status: 'pending_review',
      permissions: JSON.stringify([]),
    });
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('users', {
      mobile: ['9000000001', '9000000002', '9000000003', '9000000004', '9000000005', '9000000006'],
    });
  },
};
