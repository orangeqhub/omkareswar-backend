import request from 'supertest';
import app from '../src/app.js';
import sequelize from '../src/config/database.js';
import { LandingLead } from '../src/models/index.js';

afterAll(async () => {
  await sequelize.close();
});

async function adminToken() {
  const res = await request(app).post('/api/auth/admin/login').send({ loginId: 'ADMIN001', password: 'Admin@123' });
  return res.body.data.token;
}

describe('Landing page leads', () => {
  let createdIds = [];

  afterEach(async () => {
    if (createdIds.length) {
      await LandingLead.destroy({ where: { id: createdIds } });
      createdIds = [];
    }
  });

  it('accepts a valid landing lead', async () => {
    const res = await request(app).post('/api/landing-leads').send({
      name: 'Ravi Kumar',
      contact: '9876543210',
      cityVillage: 'Karimnagar',
      role: 'buyer',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.source).toBe('landing_page');
    expect(res.body.data.cityVillage).toBe('Karimnagar');
    createdIds.push(res.body.data.id);
  });

  it('forces the source to landing_page even if the client sends a spoofed source', async () => {
    const res = await request(app).post('/api/landing-leads').send({
      name: 'Spoofer',
      contact: '9876543210',
      cityVillage: 'Hyderabad',
      role: 'mediator',
      source: 'admin',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.source).toBe('landing_page');
    createdIds.push(res.body.data.id);
  });

  it('rejects an invalid contact number', async () => {
    const res = await request(app).post('/api/landing-leads').send({
      name: 'Bad Contact',
      contact: '12345',
      role: 'buyer',
    });
    expect(res.status).toBe(422);
  });

  it('rejects a missing city/village', async () => {
    const res = await request(app).post('/api/landing-leads').send({
      name: 'No City',
      contact: '9876543210',
      role: 'buyer',
    });
    expect(res.status).toBe(422);
  });

  it('rejects an invalid role', async () => {
    const res = await request(app).post('/api/landing-leads').send({
      name: 'Bad Role',
      contact: '9876543210',
      cityVillage: 'Warangal',
      role: 'superuser',
    });
    expect(res.status).toBe(422);
  });

  it('rejects an admin list request without a token', async () => {
    const res = await request(app).get('/api/admin/landing-leads');
    expect(res.status).toBe(401);
  });

  it('lists leads for an admin and rejects non-admin roles', async () => {
    const token = await adminToken();
    await request(app).post('/api/landing-leads').send({
      name: 'Listed Lead',
      contact: '9876543210',
      cityVillage: 'Nizamabad',
      role: 'seller',
    });

    const res = await request(app).get('/api/admin/landing-leads').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    const row = res.body.data.items.find((l) => l.name === 'Listed Lead');
    expect(row).toBeDefined();
    expect(row.source).toBe('landing_page');
    if (row) createdIds.push(row.id);
  });
});