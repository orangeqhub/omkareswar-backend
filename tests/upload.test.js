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

describe('Property image upload validation', () => {
  it('rejects a disallowed file type', async () => {
    const token = await sellerToken();
    const res = await request(app)
      .post('/api/uploads/property-image')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('not an image'), 'malware.exe');
    expect(res.status).toBe(400);
  });

  it('accepts a valid jpeg image', async () => {
    const token = await sellerToken();
    const res = await request(app)
      .post('/api/uploads/property-image')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from([0xff, 0xd8, 0xff, 0xdb]), 'photo.jpg');
    expect(res.status).toBe(201);
    expect(res.body.data.url).toMatch(/^\/uploads\/properties\//);
  });
});
