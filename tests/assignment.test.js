import request from 'supertest';
import app from '../src/app.js';
import sequelize from '../src/config/database.js';
import { User, Enquiry, Visit, Property } from '../src/models/index.js';

afterAll(async () => {
  await sequelize.close();
});

async function getAdminToken() {
  const res = await request(app).post('/api/auth/admin/login').send({ loginId: 'ADMIN001', password: 'Admin@123' });
  return res.body.data.token;
}

async function getEmployeeToken() {
  const res = await request(app).post('/api/auth/employee/login').send({ employeeId: 'EMP-2026-0001', password: 'Employee@123' });
  return res.body.data.token;
}

async function getBuyerToken() {
  await request(app).post('/api/auth/otp/request').send({ mobile: '9000000004' });
  const res = await request(app).post('/api/auth/otp/verify').send({ mobile: '9000000004', otp: '1234' });
  return res.body.data.token;
}

async function getEmployeeRow() {
  return User.findOne({ where: { memberId: 'EMP-2026-0001' } });
}

describe('Assignment-based record visibility', () => {
  let adminToken;
  let empToken;
  let emp;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    empToken = await getEmployeeToken();
    emp = await getEmployeeRow();
  });

  it('does not auto-grant VIEW_UNASSIGNED_RECORDS when an employee registration is approved', async () => {
    const pending = await User.create({
      role: 'employee',
      name: 'Approval Visibility Tester',
      mobile: '9876500001',
      status: 'pending',
    });

    const res = await request(app)
      .patch(`/api/admin/registrations/${pending.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.memberId).toMatch(/^EMP-\d{4}-\d{6}$/);
    expect(res.body.data.permissions).not.toContain('VIEW_UNASSIGNED_RECORDS');

    await pending.destroy();
  });

  it('hides unassigned enquiries from the employee list and detail until admin assigns the record', async () => {
    const property = await Property.findOne({ where: { propertyCode: 'PROP-2026-000001' } });

    const created = await request(app).post('/api/enquiries').send({
      propertyId: property.id,
      buyerName: 'Unassigned Buyer',
      buyerPhone: '9123456781',
      channel: 'whatsapp',
    });
    expect(created.status).toBe(201);
    const enquiryId = created.body.data.id;

    let list = await request(app).get('/api/employee/enquiries').set('Authorization', `Bearer ${empToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data.items.map((i) => i.id)).not.toContain(enquiryId);

    const detail = await request(app).get(`/api/enquiries/${enquiryId}`).set('Authorization', `Bearer ${empToken}`);
    expect(detail.status).toBe(404);

    const statusUpdate = await request(app)
      .patch(`/api/enquiries/${enquiryId}/status`)
      .set('Authorization', `Bearer ${empToken}`)
      .send({ status: 'contacted' });
    expect(statusUpdate.status).toBe(404);

    const assignRes = await request(app)
      .patch(`/api/admin/enquiries/${enquiryId}/assign-employee`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ employeeId: emp.id });
    expect(assignRes.status).toBe(200);

    list = await request(app).get('/api/employee/enquiries').set('Authorization', `Bearer ${empToken}`);
    expect(list.body.data.items.map((i) => i.id)).toContain(enquiryId);

    const visibleDetail = await request(app).get(`/api/enquiries/${enquiryId}`).set('Authorization', `Bearer ${empToken}`);
    expect(visibleDetail.status).toBe(200);

    await Enquiry.destroy({ where: { id: enquiryId } });
  });

  it('propagates user-level assignment so linked enquiries become visible to the employee', async () => {
    const buyer = await User.findOne({ where: { mobile: '9000000004' } });

    const created = await request(app).post('/api/enquiries').send({
      buyerId: buyer.id,
      buyerName: 'Anita Reddy',
      buyerPhone: '9000000004',
      message: 'user-level propagation test',
      channel: 'whatsapp',
    });
    expect(created.status).toBe(201);
    const enquiryId = created.body.data.id;

    const assignRes = await request(app)
      .patch(`/api/admin/users/${buyer.id}/assign-employee`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ employeeId: emp.id });
    expect(assignRes.status).toBe(200);

    const list = await request(app).get('/api/employee/enquiries').set('Authorization', `Bearer ${empToken}`);
    expect(list.body.data.items.map((i) => i.id)).toContain(enquiryId);

    const detail = await request(app).get(`/api/enquiries/${enquiryId}`).set('Authorization', `Bearer ${empToken}`);
    expect(detail.status).toBe(200);

    await User.update({ assignedEmployeeId: null }, { where: { mobile: '9000000004' } });
    await Enquiry.destroy({ where: { id: enquiryId } });
  });

  it('returns 404 when an employee acts on a visit they are not assigned to', async () => {
    const buyer = await User.findOne({ where: { mobile: '9000000004' } });
    const property = await Property.findOne({ where: { propertyCode: 'PROP-2026-000001' } });
    const buyerToken = await getBuyerToken();

    const created = await request(app)
      .post('/api/visits')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        propertyId: property.id,
        buyerId: buyer.id,
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    expect(created.status).toBe(201);
    const visitId = created.body.data.id;

    const confirm = await request(app)
      .post(`/api/visits/${visitId}/confirm`)
      .set('Authorization', `Bearer ${empToken}`);
    expect(confirm.status).toBe(404);

    const reschedule = await request(app)
      .patch(`/api/visits/${visitId}/reschedule`)
      .set('Authorization', `Bearer ${empToken}`)
      .send({ scheduledFor: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() });
    expect(reschedule.status).toBe(404);

    await Visit.destroy({ where: { id: visitId } });
  });

  it('keeps user verifications hidden until the user is assigned at user level', async () => {
    const pendingSeller = await User.findOne({ where: { mobile: '9000000006' } });
    expect(pendingSeller.verificationStatus).toBe('pending_review');

    const hidden = await request(app)
      .get(`/api/employee/user-verification/${pendingSeller.id}`)
      .set('Authorization', `Bearer ${empToken}`);
    expect(hidden.status).toBe(404);

    const assignRes = await request(app)
      .patch(`/api/admin/users/${pendingSeller.id}/assign-employee`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ employeeId: emp.id });
    expect(assignRes.status).toBe(200);

    const visible = await request(app)
      .get(`/api/employee/user-verification/${pendingSeller.id}`)
      .set('Authorization', `Bearer ${empToken}`);
    expect(visible.status).toBe(200);

    await User.update({ assignedEmployeeId: null }, { where: { mobile: '9000000006' } });
  });
});
