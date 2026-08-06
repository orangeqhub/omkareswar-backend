import request from 'supertest';
import app from '../src/app.js';
import sequelize from '../src/config/database.js';
import { Property } from '../src/models/index.js';

afterAll(async () => {
  await sequelize.close();
});

async function buyerToken() {
  await request(app).post('/api/auth/otp/request').send({ mobile: '9000000004' });
  const res = await request(app).post('/api/auth/otp/verify').send({ mobile: '9000000004', otp: '1234' });
  return { token: res.body.data.token, user: res.body.data.user };
}

describe('Visit creation', () => {
  it('schedules a new visit', async () => {
    const property = await Property.findOne({ where: { propertyCode: 'PROP-2026-000001' } });
    const { token, user } = await buyerToken();

    const scheduledFor = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .post('/api/visits')
      .set('Authorization', `Bearer ${token}`)
      .send({
        propertyId: property.id,
        buyerId: user.id,
        buyerName: user.name,
        scheduledFor,
        meetingLocation: 'Property site',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('scheduled');
    expect(res.body.data.visitCode).toMatch(/^VIS-\d{4}-\d{6}$/);
  });
});
