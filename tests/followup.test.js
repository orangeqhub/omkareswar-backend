import request from 'supertest';
import app from '../src/app.js';
import sequelize from '../src/config/database.js';
import { FollowUp } from '../src/models/index.js';

afterAll(async () => {
  await sequelize.close();
});

async function employeeToken() {
  const res = await request(app).post('/api/auth/employee/login').send({ employeeId: 'EMP-2026-0001', password: 'Employee@123' });
  return res.body.data.token;
}

describe('Follow-up update', () => {
  it('lets the assigned employee start and then complete a follow-up', async () => {
    const followUp = await FollowUp.findOne();
    expect(followUp).toBeTruthy();
    const token = await employeeToken();

    const startRes = await request(app).post(`/api/follow-ups/${followUp.id}/start`).set('Authorization', `Bearer ${token}`);
    expect(startRes.status).toBe(200);
    expect(startRes.body.data.status).toBe('in_progress');

    const completeRes = await request(app)
      .post(`/api/follow-ups/${followUp.id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({ completionNote: 'Called the buyer, visit confirmed.' });
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.status).toBe('completed');
    expect(completeRes.body.data.overdue).toBe(false);
  });
});
