import request from 'supertest';
import app from '../src/app.js';
import sequelize from '../src/config/database.js';

afterAll(async () => {
  await sequelize.close();
});

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
});
