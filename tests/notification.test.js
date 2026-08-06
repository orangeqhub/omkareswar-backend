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

describe('Notification read', () => {
  it('lists notifications for the current user and marks one as read', async () => {
    const token = await adminToken();

    const list = await request(app).get('/api/notifications/me').set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.items.length).toBeGreaterThan(0);

    const notification = list.body.data.items[0];
    const readRes = await request(app).patch(`/api/notifications/${notification.id}/read`).set('Authorization', `Bearer ${token}`);
    expect(readRes.status).toBe(200);
    expect(readRes.body.data.read).toBe(true);
  });
});
