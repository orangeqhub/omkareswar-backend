import request from 'supertest';
import app from '../src/app.js';
import sequelize from '../src/config/database.js';

afterAll(async () => {
  await sequelize.close();
});

async function adminToken() {
  const res = await request(app).post('/api/auth/admin/login').send({ loginId: 'ADMIN001', password: 'Admin@123' });
  return res.body.data.token;
}

describe('Registration submission + approval workflow', () => {
  // Randomized per run so re-running the suite against a persistent test DB never collides.
  const mobile = `9${String(Date.now()).slice(-9)}`;

  it('submits a new buyer registration', async () => {
    const res = await request(app).post('/api/registrations').send({
      role: 'buyer',
      name: 'Test Buyer',
      mobile,
      district: 'Hyderabad',
      city: 'Hyderabad',
      address: '1-2-3 Test Street',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('approved');
    expect(res.body.data.memberId).toMatch(/^BUY-\d{4}-\d{6}$/);
  });

  it('fetches application status by mobile', async () => {
    const res = await request(app).get('/api/registrations/status').query({ mobile });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('approved');
  });
});
