import request from 'supertest';
import User from '../../src/models/User.js';
import { ROLES } from '../../src/utils/constants.js';

export const TEST_PASSWORD = 'Passw0rd!23';

let sequence = 0;
const uniqueEmail = (prefix) => {
  sequence += 1;
  return `${prefix}.${Date.now()}.${sequence}@civicfix.test`;
};

export async function createUser(overrides = {}) {
  const role = overrides.role || ROLES.CITIZEN;
  const user = await User.create({
    name: overrides.name || (role === ROLES.ADMIN ? 'Admin User' : 'Test Citizen'),
    email: overrides.email || uniqueEmail(role === ROLES.ADMIN ? 'admin' : 'citizen'),
    password: overrides.password || TEST_PASSWORD,
    role,
    phone: overrides.phone || '',
    department: overrides.department || '',
  });
  return user;
}

/** Signs a user in through the real endpoint and returns the JWT. */
export async function loginAndGetToken(app, user, password = TEST_PASSWORD) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password });

  if (response.status !== 200) {
    throw new Error(`Login failed for ${user.email}: ${JSON.stringify(response.body)}`);
  }
  return response.body.data.token;
}

export const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

/** A structurally valid complaint payload. */
export const validIssuePayload = (overrides = {}) => ({
  title: 'Broken streetlight near the community hall',
  description:
    'The streetlight outside the community hall has been dead for a week and the lane is completely dark after sunset.',
  category: 'electricity',
  address: 'Community Hall Road, Ward 14',
  area: 'Ward 14',
  city: 'Pune',
  pincode: '411001',
  lat: 18.5204,
  lng: 73.8567,
  ...overrides,
});

export default { createUser, loginAndGetToken, authHeader, validIssuePayload, TEST_PASSWORD };
