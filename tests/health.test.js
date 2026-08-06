import request from 'supertest';
import app from '../src/app.js';
import sequelize from '../src/config/database.js';

afterAll(async () => {
  await sequelize.close();
});

describe('GET /api/health', () => {
  it('returns success with db connected and server time', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.db).toBe('connected');
    expect(res.body.data.time).toBeDefined();
  });
});
