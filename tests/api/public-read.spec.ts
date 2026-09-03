import { expect, test } from '@playwright/test';

/**
 * Read-only API smoke tests against the PropCatch Supabase backend.
 *
 * These hit the public PostgREST endpoints using only the anon key, so they
 * assert the surface an unauthenticated client is allowed to see (governed by
 * Supabase RLS). Nothing is created or mutated.
 *
 * Base URL + anon key are configured in playwright.config.ts (the `api`
 * project, via SUPABASE_URL / SUPABASE_ANON_KEY). Run with:
 *
 *   npx playwright test --project=api
 */

test('projects are readable anonymously', async ({ request }) => {
  const res = await request.get('/rest/v1/projects', {
    params: { limit: '10' },
  });

  expect(res.status()).toBe(200);

  const rows = await res.json();
  expect(Array.isArray(rows)).toBe(true);
  for (const row of rows) {
    expect(row).toHaveProperty('id');
    expect(row).toHaveProperty('builder_id');
  }
});

test('builders are readable anonymously', async ({ request }) => {
  const res = await request.get('/rest/v1/builders', {
    params: { limit: '10' },
  });

  expect(res.status()).toBe(200);

  const rows = await res.json();
  expect(Array.isArray(rows)).toBe(true);
  for (const row of rows) {
    expect(row).toHaveProperty('id');
    expect(row).toHaveProperty('name');
  }
});

test('localities are readable anonymously', async ({ request }) => {
  const res = await request.get('/rest/v1/localities', {
    params: { limit: '10' },
  });

  expect(res.status()).toBe(200);

  const rows = await res.json();
  expect(Array.isArray(rows)).toBe(true);
  for (const row of rows) {
    expect(row).toHaveProperty('id');
    expect(row).toHaveProperty('city_id');
  }
});

test('OpenAPI schema is not exposed to the anon key', async ({ request }) => {
  const res = await request.get('/rest/v1/');

  expect(res.status()).toBe(401);

  const body = await res.json();
  expect(body.message).toBeTruthy();
});
