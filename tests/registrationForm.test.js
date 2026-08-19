import request from 'supertest';
import app from '../src/app.js';
import sequelize from '../src/config/database.js';
import { ensureDefaultForms } from '../src/services/registrationForm.service.js';
import { RegistrationForm, RegistrationField } from '../src/models/index.js';

afterAll(async () => {
  await sequelize.close();
});

async function adminToken() {
  const res = await request(app).post('/api/auth/admin/login').send({ loginId: 'ADMIN001', password: 'Admin@123' });
  return res.body.data.token;
}

function uniqueMobile() {
  return `9${String(Date.now()).slice(-9)}`;
}

describe('Registration form CMS', () => {
  beforeAll(async () => {
    await ensureDefaultForms();
  });

  it('serves the public buyer form config with active fields only', async () => {
    const res = await request(app).get('/api/registration-forms/BUYER');
    expect(res.status).toBe(200);
    expect(res.body.data.formType).toBe('BUYER');
    const keys = res.body.data.fields.map((f) => f.fieldKey);
    expect(keys).toContain('name');
    expect(keys).toContain('mobile');
    expect(keys).toContain('email');
    const email = res.body.data.fields.find((f) => f.fieldKey === 'email');
    expect(email.isRequired).toBe(false);
    expect(res.body.data.fields.every((f) => f.isActive)).toBe(true);
  });

  it('rejects an invalid form type', async () => {
    const res = await request(app).get('/api/registration-forms/NOPE');
    expect(res.status).toBe(422);
  });

  it('rejects admin config routes without a token', async () => {
    const res = await request(app).get('/api/admin/registration-forms');
    expect(res.status).toBe(401);
  });

  it('lists all forms for an admin', async () => {
    const res = await request(app)
      .get('/api/admin/registration-forms')
      .set('Authorization', `Bearer ${await adminToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.data.map((f) => f.formType)).toEqual(
      expect.arrayContaining(['BUYER', 'SELLER', 'EMPLOYEE', 'MEDIATOR'])
    );
  });

  it('lets an admin add a required custom field, then enforce it on registration', async () => {
    const token = await adminToken();

    // 1. Add a required custom field to the buyer form
    const create = await request(app)
      .post('/api/admin/registration-forms/BUYER/fields')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fieldKey: 'occupation',
        label: 'Occupation',
        fieldType: 'text',
        isRequired: true,
        isActive: true,
      });
    expect(create.status).toBe(201);
    expect(create.body.data.isSystemField).toBe(false);
    const fieldId = create.body.data.id;

    try {
      // 2. Registration without the new mandatory field fails with a field->message map
      const missing = await request(app).post('/api/registrations').send({
        role: 'buyer',
        name: 'Dynamic Buyer',
        mobile: uniqueMobile(),
        district: 'Hyderabad',
        city: 'Hyderabad',
        address: '1-2-3 Test Street',
      });
      expect(missing.status).toBe(400);
      expect(missing.body.code).toBe('VALIDATION_ERROR');
      expect(missing.body.errors).toEqual({ occupation: 'Occupation is required.' });

      // 3. Registration with the custom field succeeds and stores it in customFields
      const ok = await request(app).post('/api/registrations').send({
        role: 'buyer',
        name: 'Dynamic Buyer',
        mobile: uniqueMobile(),
        district: 'Hyderabad',
        city: 'Hyderabad',
        address: '1-2-3 Test Street',
        customFields: { occupation: 'Software Developer' },
      });
      expect(ok.status).toBe(201);
      expect(ok.body.data.status).toBe('approved');
      expect(ok.body.data.customFields.occupation).toBe('Software Developer');
    } finally {
      // 4. Cleanup - remove the custom field so other tests keep the default form
      await request(app)
        .delete(`/api/admin/registration-forms/BUYER/fields/${fieldId}`)
        .set('Authorization', `Bearer ${token}`);
    }
  });

  it('rejects unknown fields that are not part of the active config', async () => {
    const res = await request(app).post('/api/registrations').send({
      role: 'buyer',
      name: 'Tamper Buyer',
      mobile: uniqueMobile(),
      district: 'Hyderabad',
      city: 'Hyderabad',
      address: '1-2-3 Test Street',
      status: 'admin',
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('FORBIDDEN_FIELD');
  });

  it('prevents deleting system fields', async () => {
    const token = await adminToken();
    const form = await RegistrationForm.findOne({ where: { formType: 'BUYER' } });
    const systemField = await RegistrationField.findOne({
      where: { registrationFormId: form.id, fieldKey: 'name' },
    });

    const res = await request(app)
      .delete(`/api/admin/registration-forms/BUYER/fields/${systemField.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('SYSTEM_FIELD_DELETE_FORBIDDEN');
  });

  it('prevents renaming a system field', async () => {
    const token = await adminToken();
    const form = await RegistrationForm.findOne({ where: { formType: 'BUYER' } });
    const systemField = await RegistrationField.findOne({
      where: { registrationFormId: form.id, fieldKey: 'name' },
    });

    const res = await request(app)
      .patch(`/api/admin/registration-forms/BUYER/fields/${systemField.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ fieldKey: 'fullName' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('SYSTEM_FIELD_KEY_LOCKED');
  });

  it('reorders fields', async () => {
    const token = await adminToken();
    const res = await request(app)
      .get('/api/admin/registration-forms/BUYER')
      .set('Authorization', `Bearer ${token}`);
    const current = res.body.data.fields.map((f) => f.fieldKey);
    const reversed = [...current].reverse();

    const reordered = await request(app)
      .patch('/api/admin/registration-forms/BUYER/fields/reorder')
      .set('Authorization', `Bearer ${token}`)
      .send({ order: reversed });
    expect(reordered.status).toBe(200);
    expect(reordered.body.data.map((f) => f.fieldKey)).toEqual(reversed);

    // restore original order
    await request(app)
      .patch('/api/admin/registration-forms/BUYER/fields/reorder')
      .set('Authorization', `Bearer ${token}`)
      .send({ order: current });
  });

  it('validates registration payloads against the employee form for admin creation', async () => {
    const token = await adminToken();

    // Missing mandatory first/last name and document uploads -> dynamic validation error
    const missing = await request(app)
      .post('/api/admin/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({
        mobile: uniqueMobile(),
        email: 'agent@test.com',
        password: 'Secret@123',
        confirmPassword: 'Secret@123',
        permissions: [],
      });
    expect(missing.status).toBe(400);
    expect(missing.body.code).toBe('VALIDATION_ERROR');
    expect(missing.body.errors.firstName).toBeDefined();
    expect(missing.body.errors.lastName).toBeDefined();
    expect(missing.body.errors.aadhaarCard).toBeDefined();
    expect(missing.body.errors.panCard).toBeDefined();

    // Valid submission with document URLs -> created, name auto-computed
    const ok = await request(app)
      .post('/api/admin/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'New',
        lastName: 'Agent',
        mobile: uniqueMobile(),
        email: 'agent@test.com',
        password: 'Secret@123',
        confirmPassword: 'Secret@123',
        permissions: [],
        aadhaarCard: 'https://example.com/aadhaar.jpg',
        panCard: 'https://example.com/pan.jpg',
      });
    expect(ok.status).toBe(201);
    expect(ok.body.data.role).toBe('employee');
    expect(ok.body.data.name).toBe('New Agent');
    expect(ok.body.data.memberId).toMatch(/^EMP-\d{4}-\d{6}$/);
    expect(ok.body.data.roleDetail.aadhaarCard).toBe('https://example.com/aadhaar.jpg');
  });

  it('returns a field->message error map when required fields are missing', async () => {
    const res = await request(app).post('/api/registrations').send({
      role: 'seller',
      name: 'Incomplete Seller',
      mobile: uniqueMobile(),
      district: 'Hyderabad',
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors.city).toBe('City is required.');
    expect(res.body.errors.address).toBe('Address is required.');
  });
});
