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

const submitIssue = (token, payload = {}) =>
  request(app)
    .post('/api/issues')
    .set(authHeader(token))
    .send(validIssuePayload(payload));

describe('POST /api/issues', () => {
  it('requires authentication', async () => {
    const response = await request(app).post('/api/issues').send(validIssuePayload());
    expect(response.status).toBe(401);
  });

  it('creates a complaint owned by the caller with a unique reference', async () => {
    const citizen = await createUser();
    const token = await loginAndGetToken(app, citizen);

    const response = await submitIssue(token);

    expect(response.status).toBe(201);
    expect(response.body.data.complaintId).toMatch(/^CIV-\d{6}-[A-Z0-9]{4}$/);
    expect(response.body.data.status).toBe('submitted');
    expect(response.body.data.reportedBy.id || response.body.data.reportedBy).toBeTruthy();

    const stored = await Issue.findOne({ complaintId: response.body.data.complaintId });
    expect(String(stored.reportedBy)).toBe(String(citizen._id));
    expect(stored.statusHistory).toHaveLength(1);
  });

  it('applies the category priority rule by default', async () => {
    const token = await loginAndGetToken(app, await createUser());

    const response = await submitIssue(token, {
      category: 'roads',
      title: 'Sunken road surface near the junction',
    });

    expect(response.body.data.priority).toBe('high');
    expect(response.body.data.assignedDepartment).toBe('Public Works Department');
  });

  it('lets the citizen pick an explicit priority', async () => {
    const token = await loginAndGetToken(app, await createUser());
    const response = await submitIssue(token, { priority: 'urgent' });
    expect(response.body.data.priority).toBe('urgent');
  });

  it('rejects an invalid payload with field level details', async () => {
    const token = await loginAndGetToken(app, await createUser());

    const response = await submitIssue(token, { title: 'bad', lat: 200 });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
    const fields = response.body.details.map((detail) => detail.field);
    expect(fields).toContain('title');
    expect(fields).toContain('lat');
  });

  it('notifies every administrator about a new complaint', async () => {
    const admin = await createUser({ role: 'admin' });
    const token = await loginAndGetToken(app, await createUser());

    await submitIssue(token);

    const notifications = await Notification.find({ recipient: admin._id });
    expect(notifications).toHaveLength(1);
    expect(notifications[0].message).toContain('reported');
  });

  it('creates a submission notification for the reporting citizen', async () => {
    const citizen = await createUser();
    const token = await loginAndGetToken(app, citizen);

    await submitIssue(token);

    const notifications = await Notification.find({ recipient: citizen._id });
    expect(notifications.some((entry) => entry.type === 'submission')).toBe(true);
  });
});

describe('GET /api/issues', () => {
  it('is publicly readable and paginated', async () => {
    const token = await loginAndGetToken(app, await createUser());
    await submitIssue(token);
    await submitIssue(token, { title: 'Second complaint about garbage bins', category: 'garbage' });

    const response = await request(app).get('/api/issues?limit=1');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta.total).toBe(2);
    expect(response.body.meta.totalPages).toBe(2);
  });

  it('filters by category and status', async () => {
    const token = await loginAndGetToken(app, await createUser());
    await submitIssue(token);
    await submitIssue(token, { title: 'Second complaint about garbage bins', category: 'garbage' });

    const response = await request(app).get('/api/issues?category=garbage');

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].category).toBe('garbage');
  });

  it('supports text search across title and reference', async () => {
    const token = await loginAndGetToken(app, await createUser());
    const created = await submitIssue(token);
    await submitIssue(token, { title: 'Second complaint about garbage bins', category: 'garbage' });

    const byReference = await request(app).get(
      `/api/issues?search=${created.body.data.complaintId}`,
    );

    expect(byReference.body.data).toHaveLength(1);
    expect(byReference.body.data[0].complaintId).toBe(created.body.data.complaintId);
  });

  it('reports whether the viewer has already upvoted', async () => {
    const citizen = await createUser();
    const token = await loginAndGetToken(app, citizen);
    const created = await submitIssue(token);

    await request(app)
      .post(`/api/issues/${created.body.data.id}/upvote`)
      .set(authHeader(token));

    const anonymous = await request(app).get('/api/issues');
    expect(anonymous.body.data[0].hasUpvoted).toBe(false);

    const authenticated = await request(app).get('/api/issues').set(authHeader(token));
    expect(authenticated.body.data[0].hasUpvoted).toBe(true);
  });
});

describe('GET /api/issues/:id', () => {
  it('resolves a human readable complaint reference', async () => {
    const token = await loginAndGetToken(app, await createUser());
    const created = await submitIssue(token);

    const response = await request(app).get(`/api/issues/${created.body.data.complaintId}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(created.body.data.id);
  });

  it('returns 404 for an unknown complaint', async () => {
    const response = await request(app).get('/api/issues/CIV-000000-ZZZZ');
    expect(response.status).toBe(404);
  });
});

describe('community upvoting', () => {
  it('counts one vote per citizen', async () => {
    const author = await createUser();
    const authorToken = await loginAndGetToken(app, author);
    const created = await submitIssue(authorToken);

    const supporter = await createUser();
    const supporterToken = await loginAndGetToken(app, supporter);

    const first = await request(app)
      .post(`/api/issues/${created.body.data.id}/upvote`)
      .set(authHeader(supporterToken));
    expect(first.body.data.upvoteCount).toBe(1);

    // Voting twice must not double count.
    const second = await request(app)
      .post(`/api/issues/${created.body.data.id}/upvote`)
      .set(authHeader(supporterToken));
    expect(second.body.data.upvoteCount).toBe(1);

    const stored = await Issue.findById(created.body.data.id).select('+upvotes');
    expect(stored.upvotes).toHaveLength(1);
  });

  it('allows removing support', async () => {
    const author = await createUser();
    const created = await submitIssue(await loginAndGetToken(app, author));
    const supporter = await createUser();
    const supporterToken = await loginAndGetToken(app, supporter);

    await request(app)
      .post(`/api/issues/${created.body.data.id}/upvote`)
      .set(authHeader(supporterToken));

    const removed = await request(app)
      .delete(`/api/issues/${created.body.data.id}/upvote`)
      .set(authHeader(supporterToken));

    expect(removed.body.data.upvoteCount).toBe(0);
    expect(removed.body.data.hasUpvoted).toBe(false);
  });

  it('requires authentication', async () => {
    const author = await createUser();
    const created = await submitIssue(await loginAndGetToken(app, author));
    const response = await request(app).post(`/api/issues/${created.body.data.id}/upvote`);
    expect(response.status).toBe(401);
  });
});

describe('ownership enforcement', () => {
  it('prevents a citizen from editing another citizen\'s complaint', async () => {
    const author = await createUser();
    const created = await submitIssue(await loginAndGetToken(app, author));

    const stranger = await createUser();
    const strangerToken = await loginAndGetToken(app, stranger);

    const response = await request(app)
      .patch(`/api/issues/${created.body.data.id}`)
      .set(authHeader(strangerToken))
      .send({ title: 'Hijacked complaint title' });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('EDIT_NOT_ALLOWED');
  });

  it('prevents a citizen from changing the complaint status directly', async () => {
    const author = await createUser();
    const token = await loginAndGetToken(app, author);
    const created = await submitIssue(token);

    const response = await request(app)
      .patch(`/api/issues/${created.body.data.id}`)
      .set(authHeader(token))
      .send({ status: 'resolved' });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('STATUS_CHANGE_FORBIDDEN');
  });

  it('allows the owner to edit while the complaint is still submitted', async () => {
    const author = await createUser();
    const token = await loginAndGetToken(app, author);
    const created = await submitIssue(token);

    const response = await request(app)
      .patch(`/api/issues/${created.body.data.id}`)
      .set(authHeader(token))
      .send({ title: 'Corrected complaint title for the same issue' });

    expect(response.status).toBe(200);
    expect(response.body.data.title).toBe('Corrected complaint title for the same issue');
  });

  it('prevents a citizen from deleting another citizen\'s complaint', async () => {
    const author = await createUser();
    const created = await submitIssue(await loginAndGetToken(app, author));
    const strangerToken = await loginAndGetToken(app, await createUser());

    const response = await request(app)
      .delete(`/api/issues/${created.body.data.id}`)
      .set(authHeader(strangerToken));

    expect(response.status).toBe(403);
  });

  it('allows the owner to withdraw their own submitted complaint', async () => {
    const author = await createUser();
    const token = await loginAndGetToken(app, author);
    const created = await submitIssue(token);

    const response = await request(app)
      .delete(`/api/issues/${created.body.data.id}`)
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(await Issue.countDocuments()).toBe(0);
  });
});
