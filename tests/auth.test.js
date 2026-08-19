import request from 'supertest';
import app from '../src/app.js';
import sequelize from '../src/config/database.js';
import { Op } from 'sequelize';
import { Notification } from '../src/models/index.js';

afterAll(async () => {
  await sequelize.close();
});

function uniqueMobile() {
  return `9${String(Date.now()).slice(-9)}`;
}

describe('Auth flows', () => {
  it('requests an OTP for a valid mobile number', async () => {
    const res = await request(app).post('/api/auth/otp/request').send({ mobile: '9000000004' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.demoOtp).toBe('1234');
  });

  it('logs a public buyer in with a valid OTP', async () => {
    await request(app).post('/api/auth/otp/request').send({ mobile: '9000000004' });
    const res = await request(app).post('/api/auth/otp/verify').send({ mobile: '9000000004', otp: '1234' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('buyer');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('rejects an invalid OTP', async () => {
    await request(app).post('/api/auth/otp/request').send({ mobile: '9000000004' });
    const res = await request(app).post('/api/auth/otp/verify').send({ mobile: '9000000004', otp: '9999' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_OTP');
  });

  it('blocks login for a pending account', async () => {
    await request(app).post('/api/auth/otp/request').send({ mobile: '9000000006' });
    const res = await request(app).post('/api/auth/otp/verify').send({ mobile: '9000000006', otp: '1234' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('ACCOUNT_PENDING');
  });

  it('logs the admin in with loginId + password', async () => {
    const res = await request(app).post('/api/auth/admin/login').send({ loginId: 'ADMIN001', password: 'Admin@123' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('admin');
    expect(res.body.data.token).toBeDefined();
  });

  it('rejects an invalid admin password', async () => {
    const res = await request(app).post('/api/auth/admin/login').send({ loginId: 'ADMIN001', password: 'WrongPass1' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('logs the employee in with employeeId + password', async () => {
    const res = await request(app).post('/api/auth/employee/login').send({ employeeId: 'EMP-2026-0001', password: 'Employee@123' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('employee');
  });

  it('returns the current session for GET /api/auth/me', async () => {
    const login = await request(app).post('/api/auth/admin/login').send({ loginId: 'ADMIN001', password: 'Admin@123' });
    const token = login.body.data.token;

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('admin');
  });

  it('blocks a non-admin from an admin-only route (role authorization)', async () => {
    const login = await request(app).post('/api/auth/otp/verify').send({ mobile: '9000000004', otp: '1234' });
    const token = login.body.data.token;

    const res = await request(app).get('/api/admin/audit-logs').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('ROLE_NOT_ALLOWED');
  });

  it('blocks an employee without the required permission from admin settings', async () => {
    const login = await request(app).post('/api/auth/employee/login').send({ employeeId: 'EMP-2026-0001', password: 'Employee@123' });
    const token = login.body.data.token;

    // The seeded employee does not have ADMIN_SETTINGS_VIEW (it is never assignable)
    const res = await request(app).get('/api/admin/settings').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('ROLE_NOT_ALLOWED');
  });

  it('lets an employee change their own password and notifies admins', async () => {
    const admin = await request(app).post('/api/auth/admin/login').send({ loginId: 'ADMIN001', password: 'Admin@123' });
    const adminToken = admin.body.data.token;

    const created = await request(app)
      .post('/api/admin/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Password',
        lastName: 'Changer',
        mobile: uniqueMobile(),
        password: 'OldPass@123',
        confirmPassword: 'OldPass@123',
        permissions: [],
        aadhaarCard: 'https://example.com/aadhaar.jpg',
        panCard: 'https://example.com/pan.jpg',
      });
    expect(created.status).toBe(201);
    const employeeId = created.body.data.memberId;

    const login = await request(app).post('/api/auth/employee/login').send({ employeeId, password: 'OldPass@123' });
    expect(login.status).toBe(200);
    const token = login.body.data.token;

    // Wrong current password is rejected
    const wrong = await request(app)
      .post('/api/users/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongPass@1', newPassword: 'NewPass@456' });
    expect(wrong.status).toBe(400);
    expect(wrong.body.code).toBe('CURRENT_PASSWORD_WRONG');

    // Correct change succeeds and never exposes the password to the caller
    const res = await request(app)
      .post('/api/users/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'OldPass@123', newPassword: 'NewPass@456' });
    expect(res.status).toBe(200);
    expect(res.body.data.temporaryPassword).toBeUndefined();

    // New password works, old one no longer does
    const newLogin = await request(app).post('/api/auth/employee/login').send({ employeeId, password: 'NewPass@456' });
    expect(newLogin.status).toBe(200);
    const oldLogin = await request(app).post('/api/auth/employee/login').send({ employeeId, password: 'OldPass@123' });
    expect(oldLogin.status).toBe(401);

    // An admin-facing notification records the new password
    const notification = await Notification.findOne({
      where: {
        audienceRole: 'admin',
        titleEn: { [Op.like]: `%${employeeId}) updated their password. New password: NewPass@456` },
      },
    });
    expect(notification).not.toBeNull();
  });
});
