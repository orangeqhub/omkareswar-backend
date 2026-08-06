import request from 'supertest';
import app from '../src/app.js';
import sequelize from '../src/config/database.js';
import { Property } from '../src/models/index.js';

afterAll(async () => {
  await sequelize.close();
});

describe('Enquiry creation', () => {
  it('creates a new enquiry for an existing property', async () => {
    const property = await Property.findOne({ where: { propertyCode: 'PROP-2026-000001' } });
    expect(property).toBeTruthy();

    const res = await request(app).post('/api/enquiries').send({
      propertyId: property.id,
      buyerName: 'Test Enquirer',
      buyerPhone: '9123456780',
      message: 'Is this still available?',
      channel: 'whatsapp',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('new');
    expect(res.body.data.enquiryCode).toMatch(/^ENQ-\d{4}-\d{6}$/);
  });
});
