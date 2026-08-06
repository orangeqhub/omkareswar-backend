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

describe('Excel report download', () => {
  it('downloads the properties report as an xlsx file', async () => {
    const token = await adminToken();
    const res = await request(app)
      .get('/api/admin/reports/properties.xlsx')
      .set('Authorization', `Bearer ${token}`)
      .buffer(true)
      .parse((response, callback) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => callback(null, Buffer.concat(chunks)));
      });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('spreadsheetml');
    expect(res.body.length).toBeGreaterThan(0);
  });
});
