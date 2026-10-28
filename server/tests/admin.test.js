import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import Issue from '../src/models/Issue.js';
import Notification from '../src/models/Notification.js';
import { clearDatabase, startTestDb, stopTestDb } from './helpers/testDb.js';
import {
  authHeader,
  createUser,
  loginAndGetToken,
  validIssuePayload,
} from './helpers/factories.js';

const app = createApp();

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearDatabase);

/** Sets up an admin + citizen + one complaint and returns the handles. */
async function scenario(payload = {}) {
  const admin = await createUser({ role: 'admin', name: 'Admin Nair' });
  const citizen = await createUser({ name: 'Citizen Rao' });
  const adminToken = await loginAndGetToken(app, admin);
  const citizenToken = await loginAndGetToken(app, citizen);

  const created = await request(app)
    .post('/api/issues')
    .set(authHeader(citizenToken))
    .send(validIssuePayload(payload));

  return {
    admin,
    citizen,
    adminToken,
    citizenToken,
    issue: created.body.data,
  };
}

describe('administrator authorization', () => {
  it('blocks citizens from the admin stats endpoint', async () => {
    const { citizenToken } = await scenario();

    const response = await request(app)
      .get('/api/admin/stats')
      .set(authHeader(citizenToken));

    expect(response.status).toBe(403);
  });

  it('blocks anonymous access to admin endpoints', async () => {
    const response = await request(app).get('/api/admin/issues');
    expect(response.status).toBe(401);
  });

  it('blocks citizens from changing a status', async () => {
    const { citizenToken, issue } = await scenario();

    const response = await request(app)
      .patch(`/api/admin/issues/${issue.id}/status`)
      .set(authHeader(citizenToken))
      .send({ status: 'resolved' });

    expect(response.status).toBe(403);
  });

  it('blocks citizens from reassigning a complaint', async () => {
    const { citizenToken, issue } = await scenario();

    const response = await request(app)
      .patch(`/api/admin/issues/${issue.id}/assign`)
      .set(authHeader(citizenToken))
      .send({ department: 'Sanitation & Solid Waste' });

    expect(response.status).toBe(403);
  });
});

describe('GET /api/admin/stats', () => {
  it('computes metrics from real records', async () => {
    const { adminToken, issue } = await scenario();

    await request(app)
      .patch(`/api/admin/issues/${issue.id}/status`)
      .set(authHeader(adminToken))
      .send({ status: 'acknowledged' });

    const second = await request(app)
      .post('/api/issues')
      .set(authHeader(await loginAndGetToken(app, await createUser())))
      .send(validIssuePayload({ title: 'Overflowing drain near the school gate', category: 'drainage' }));

    await request(app)
      .patch(`/api/admin/issues/${second.body.data.id}/status`)
      .set(authHeader(adminToken))
      .send({ status: 'resolved', resolutionNote: 'Drain cleared and disinfected.' });

    const response = await request(app)
      .get('/api/admin/stats')
      .set(authHeader(adminToken));

    expect(response.status).toBe(200);
    const { totals, resolutionRate, byCategory, timeline } = response.body.data;

    expect(totals.total).toBe(2);
    expect(totals.acknowledged).toBe(1);
    expect(totals.resolved).toBe(1);
    expect(resolutionRate).toBe(50);
    expect(byCategory.reduce((sum, row) => sum + row.count, 0)).toBe(2);
    expect(timeline.length).toBeGreaterThanOrEqual(7);
  });
});

describe('PATCH /api/admin/issues/:id/status', () => {
  it('moves a complaint through the workflow and timestamps each step', async () => {
    const { adminToken, issue } = await scenario();

    const acknowledged = await request(app)
      .patch(`/api/admin/issues/${issue.id}/status`)
      .set(authHeader(adminToken))
      .send({ status: 'acknowledged', note: 'Forwarded to the ward officer.' });

    expect(acknowledged.status).toBe(200);
    expect(acknowledged.body.data.status).toBe('acknowledged');
    expect(acknowledged.body.data.acknowledgedAt).toBeTruthy();
    expect(acknowledged.body.data.statusHistory).toHaveLength(2);

    const inProgress = await request(app)
      .patch(`/api/admin/issues/${issue.id}/status`)
      .set(authHeader(adminToken))
      .send({ status: 'in_progress', note: 'Crew dispatched.' });

    expect(inProgress.body.data.status).toBe('in_progress');
    expect(inProgress.body.data.startedAt).toBeTruthy();

    const resolved = await request(app)
      .patch(`/api/admin/issues/${issue.id}/status`)
      .set(authHeader(adminToken))
      .send({ status: 'resolved', resolutionNote: 'Lamp replaced and tested.' });

    expect(resolved.body.data.status).toBe('resolved');
    expect(resolved.body.data.resolvedAt).toBeTruthy();
    expect(resolved.body.data.resolution.note).toBe('Lamp replaced and tested.');
    expect(resolved.body.data.statusHistory).toHaveLength(4);
  });

  it('notifies the reporting citizen on every status change', async () => {
    const { adminToken, citizen, issue } = await scenario();

    await request(app)
      .patch(`/api/admin/issues/${issue.id}/status`)
      .set(authHeader(adminToken))
      .send({ status: 'acknowledged', note: 'Received by the ward office.' });

    const notifications = await Notification.find({
      recipient: citizen._id,
      type: 'acknowledged',
    });

    expect(notifications).toHaveLength(1);
    expect(notifications[0].message).toMatch(/acknowledged/i);
    expect(notifications[0].issueComplaintId).toBe(issue.complaintId);
  });

  it('records a rejection reason', async () => {
    const { adminToken, issue } = await scenario();

    const response = await request(app)
      .patch(`/api/admin/issues/${issue.id}/status`)
      .set(authHeader(adminToken))
      .send({ status: 'rejected', rejectionReason: 'Not a municipal responsibility.' });

    expect(response.body.data.status).toBe('rejected');
    expect(response.body.data.rejectionReason).toBe('Not a municipal responsibility.');
  });

  it('rejects an unknown status value', async () => {
    const { adminToken, issue } = await scenario();

    const response = await request(app)
      .patch(`/api/admin/issues/${issue.id}/status`)
      .set(authHeader(adminToken))
      .send({ status: 'fixed-ish' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('PATCH /api/admin/issues/:id/assign', () => {
  it('assigns a department and an officer', async () => {
    const { adminToken, admin, issue } = await scenario();

    const response = await request(app)
      .patch(`/api/admin/issues/${issue.id}/assign`)
      .set(authHeader(adminToken))
      .send({ department: 'Electricity & Street Lighting', assignedTo: String(admin._id) });

    expect(response.status).toBe(200);
    expect(response.body.data.assignedDepartment).toBe('Electricity & Street Lighting');
    expect(response.body.data.assignedTo.name).toBe('Admin Nair');
  });

  it('rejects assigning a complaint to a citizen', async () => {
    const { adminToken, citizen, issue } = await scenario();

    const response = await request(app)
      .patch(`/api/admin/issues/${issue.id}/assign`)
      .set(authHeader(adminToken))
      .send({ assignedTo: String(citizen._id) });

    expect(response.status).toBe(400);
  });

  it('rejects an unknown department', async () => {
    const { adminToken, issue } = await scenario();

    const response = await request(app)
      .patch(`/api/admin/issues/${issue.id}/assign`)
      .set(authHeader(adminToken))
      .send({ department: 'Ministry of Silly Walks' });

    expect(response.status).toBe(400);
  });
});

describe('GET /api/admin/issues', () => {
  it('lists everything with filters and pagination meta', async () => {
    const { adminToken, citizenToken } = await scenario();

    await request(app)
      .post('/api/issues')
      .set(authHeader(citizenToken))
      .send(validIssuePayload({ title: 'Garbage pile near the vegetable market', category: 'garbage' }));

    const all = await request(app).get('/api/admin/issues').set(authHeader(adminToken));
    expect(all.body.meta.total).toBe(2);

    const filtered = await request(app)
      .get('/api/admin/issues?category=garbage&sortBy=priority&order=desc')
      .set(authHeader(adminToken));

    expect(filtered.body.data).toHaveLength(1);
    expect(filtered.body.data[0].category).toBe('garbage');
  });
});

describe('DELETE /api/admin/issues/:id', () => {
  it('lets an administrator remove any complaint', async () => {
    const { adminToken, issue } = await scenario();

    const response = await request(app)
      .delete(`/api/admin/issues/${issue.id}`)
      .set(authHeader(adminToken));

    expect(response.status).toBe(200);
    expect(await Issue.countDocuments()).toBe(0);
  });
});
