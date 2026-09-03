import { expect, test } from '@playwright/test';
import { decodeJwtPayload, rest, signIn } from './supabase';

/**
 * Authenticated, read-only API tests against the PropCatch Supabase backend.
 *
 * The point here is RLS visibility: the same `/users` and `/enquiries`
 * endpoints must return different data depending on who is asking. A non-admin
 * user sees only their own rows; an admin sees everyone; an anonymous client
 * sees nothing. Nothing is created or mutated.
 *
 * Run with: npx playwright test --project=api
 */

const USER_EMAIL = process.env.TEST_USER_EMAIL;
const USER_PASSWORD = process.env.TEST_USER_PASSWORD;
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

// Sign-in happens once; keep the tests sequential so the module state is safe.
test.describe.configure({ mode: 'serial' });

let userToken: string;
let userSub: string;
let adminToken: string;
let adminSub: string;

test.beforeAll(async () => {
  expect(USER_EMAIL && USER_PASSWORD, 'TEST_USER_* missing from .env').toBeTruthy();
  expect(ADMIN_EMAIL && ADMIN_PASSWORD, 'TEST_ADMIN_* missing from .env').toBeTruthy();

  const user = await signIn(USER_EMAIL!, USER_PASSWORD!);
  const admin = await signIn(ADMIN_EMAIL!, ADMIN_PASSWORD!);

  userToken = user.accessToken;
  userSub = user.userId;
  adminToken = admin.accessToken;
  adminSub = admin.userId;

  // The two test identities must actually be different users.
  expect(userSub).not.toBe(adminSub);
});

test('password grant returns an authenticated user token', () => {
  const claims = decodeJwtPayload(userToken);

  expect(claims.role).toBe('authenticated');
  expect(claims.email).toBe(USER_EMAIL);
});

test('a non-admin user sees only their own row in users', async () => {
  const api = await rest(userToken);
  const res = await api.get('/rest/v1/users');
  const rows = await res.json();
  await api.dispose();

  expect(res.status()).toBe(200);
  expect(Array.isArray(rows)).toBe(true);
  expect(rows.length).toBeGreaterThan(0);
  for (const row of rows) {
    expect(row.id).toBe(userSub);
  }
});

test('a non-admin user cannot read another user by id', async () => {
  const api = await rest(userToken);
  const res = await api.get('/rest/v1/users', { params: { id: `eq.${adminSub}` } });
  const rows = await res.json();
  await api.dispose();

  expect(res.status()).toBe(200);
  expect(rows).toEqual([]);
});

test('an admin can read another user by id', async () => {
  const api = await rest(adminToken);
  const res = await api.get('/rest/v1/users', { params: { id: `eq.${userSub}` } });
  const rows = await res.json();
  await api.dispose();

  expect(res.status()).toBe(200);
  expect(rows).toHaveLength(1);
  expect(rows[0].id).toBe(userSub);
});

test('enquiries are scoped to the owning user', async () => {
  const api = await rest(userToken);
  const res = await api.get('/rest/v1/enquiries', { params: { limit: '100' } });
  const rows = await res.json();
  await api.dispose();

  expect(res.status()).toBe(200);
  expect(Array.isArray(rows)).toBe(true);
  for (const row of rows) {
    expect(row.user_id).toBe(userSub);
  }
});

test('an invalid bearer token is rejected', async () => {
  const api = await rest('not-a-valid-jwt');
  const res = await api.get('/rest/v1/users');
  await api.dispose();

  expect(res.status()).toBe(401);
});

test('anonymous clients see nothing in users', async () => {
  const api = await rest(); // anon key
  const res = await api.get('/rest/v1/users');
  const rows = await res.json();
  await api.dispose();

  expect(res.status()).toBe(200);
  expect(rows).toEqual([]);
});
