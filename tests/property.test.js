import request from 'supertest';
import app from '../src/app.js';
import sequelize from '../src/config/database.js';

afterAll(async () => {
  await sequelize.close();
});

async function sellerToken() {
  await request(app).post('/api/auth/otp/request').send({ mobile: '9000000003' });
  const res = await request(app).post('/api/auth/otp/verify').send({ mobile: '9000000003', otp: '1234' });
  return res.body.data.token;
}

async function buyerToken() {
  await request(app).post('/api/auth/otp/request').send({ mobile: '9000000004' });
  const res = await request(app).post('/api/auth/otp/verify').send({ mobile: '9000000004', otp: '1234' });
  return res.body.data.token;
}

describe('Property draft + submit + filters + ownership', () => {
  let token;
  let propertyId;

  beforeAll(async () => {
    token = await sellerToken();
  });

  it('creates a draft property', async () => {
    const res = await request(app)
      .post('/api/properties/drafts')
      .set('Authorization', `Bearer ${token}`)
      .send({ categorySlug: 'apartments', titleEn: 'Test Draft Apartment', city: 'Hyderabad', price: 5000000 });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.propertyCode).toMatch(/^PROP-\d{4}-\d{4}$/);
    propertyId = res.body.data.id;
  });

  it('submits the draft for review', async () => {
    const res = await request(app).post(`/api/properties/${propertyId}/submit`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.moderationStatus).toBe('submitted');
  });

  it('lists active properties filtered by city on the public listing', async () => {
    const res = await request(app).get('/api/properties').query({ city: 'Hyderabad', status: 'active' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.total).toBeGreaterThanOrEqual(0);
  });

  it('prevents another seller-role user (buyer here) from editing the property', async () => {
    const otherToken = await buyerToken();
    const res = await request(app)
      .patch(`/api/properties/${propertyId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ titleEn: 'Hacked title' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });
});
