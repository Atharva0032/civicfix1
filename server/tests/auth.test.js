import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { clearDatabase, startTestDb, stopTestDb } from './helpers/testDb.js';
import { createUser, loginAndGetToken, TEST_PASSWORD } from './helpers/factories.js';

const app = createApp();

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearDatabase);

describe('POST /api/auth/register', () => {
  it('creates a citizen account and returns a token', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Asha Rao', email: 'asha@civicfix.test', password: TEST_PASSWORD });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeTypeOf('string');
    expect(response.body.data.user.role).toBe('citizen');
  });

  it('never leaks the password hash', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Asha Rao', email: 'asha@civicfix.test', password: TEST_PASSWORD });

    expect(JSON.stringify(response.body)).not.toContain('$2a$');
    expect(response.body.data.user.password).toBeUndefined();
  });

  it('ignores a client supplied admin role', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Sneaky User',
        email: 'sneaky@civicfix.test',
        password: TEST_PASSWORD,
        role: 'admin',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.user.role).toBe('citizen');
  });

  it('rejects duplicate emails with 409', async () => {
    await createUser({ email: 'dupe@civicfix.test' });

    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Another User', email: 'dupe@civicfix.test', password: TEST_PASSWORD });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('EMAIL_IN_USE');
  });

  it('rejects a weak password with a field-level validation error', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Weak User', email: 'weak@civicfix.test', password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(response.body.details.some((detail) => detail.field === 'password')).toBe(true);
  });
});

describe('POST /api/auth/login', () => {
  it('returns a token for valid credentials', async () => {
    const user = await createUser({ email: 'login@civicfix.test' });
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: TEST_PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.data.token).toBeTypeOf('string');
  });

  it('rejects a wrong password with 401', async () => {
    const user = await createUser({ email: 'login2@civicfix.test' });
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'WrongPassword1' });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('gives the same error for an unknown email (no user enumeration)', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@civicfix.test', password: TEST_PASSWORD });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Incorrect email or password.');
  });
});

describe('GET /api/auth/me', () => {
  it('requires authentication', async () => {
    const response = await request(app).get('/api/auth/me');
    expect(response.status).toBe(401);
  });

  it('rejects a malformed token', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(response.status).toBe(401);
  });

  it('returns the authenticated profile', async () => {
    const user = await createUser({ email: 'me@civicfix.test', name: 'Meera Iyer' });
    const token = await loginAndGetToken(app, user);

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe(user.email);
    expect(response.body.data.user.password).toBeUndefined();
  });
});

describe('role based access control', () => {
  it('blocks citizens from the admin-only probe endpoint', async () => {
    const citizen = await createUser();
    const token = await loginAndGetToken(app, citizen);

    const response = await request(app)
      .get('/api/auth/admin-check')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('FORBIDDEN');
  });

  it('allows administrators through the same endpoint', async () => {
    const admin = await createUser({ role: 'admin' });
    const token = await loginAndGetToken(app, admin);

    const response = await request(app)
      .get('/api/auth/admin-check')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });
});
