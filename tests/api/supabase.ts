import { expect, request, type APIRequestContext } from '@playwright/test';

/**
 * Minimal Supabase client for the API tests.
 *
 * The anon key is public by design (role `anon` — only what RLS allows).
 * User/admin tokens come from the GoTrue password grant using the creds in
 * `.env` and carry `role: authenticated`.
 */

export const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://swparfqoughqrrocwcka.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3cGFyZnFvdWdocXJyb2N3Y2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzODExOTQsImV4cCI6MjA4NTk1NzE5NH0.v5opPfrQZ2SOtU2SG9E-pH81Mof2YGiFlBoJ8lhI6KM';

export interface SupabaseSession {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
}

/** Sign in via the GoTrue password grant and return the session. */
export async function signIn(
  email: string,
  password: string,
): Promise<SupabaseSession> {
  const ctx = await request.newContext({
    baseURL: SUPABASE_URL,
    extraHTTPHeaders: { apikey: SUPABASE_ANON_KEY },
  });

  const res = await ctx.post('/auth/v1/token', {
    params: { grant_type: 'password' },
    data: { email, password },
  });
  const body = await res.json();
  await ctx.dispose();

  if (res.status() !== 200) {
    throw new Error(
      `Supabase sign-in failed (${res.status()}): ${JSON.stringify(body)}`,
    );
  }

  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    userId: body.user.id,
    email: body.user.email,
  };
}

/**
 * Create an API context pointed at the PostgREST base. Pass a user/admin
 * access token to act as that user; otherwise the anon key is used.
 */
export async function rest(token?: string): Promise<APIRequestContext> {
  // baseURL is host-only; callers pass the full `/rest/v1/...` path.
  return request.newContext({
    baseURL: SUPABASE_URL,
    extraHTTPHeaders: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token ?? SUPABASE_ANON_KEY}`,
    },
  });
}

/** Decode a JWT payload (base64url) without verifying the signature. */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  const payload = token.split('.')[1];
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(normalized, 'base64').toString('utf8'));
}

export type PublicBuilderRow = { id: string; name: string };

/** Anon GET /rest/v1/builders — the same surface the user site can read. */
export async function fetchPublicBuilders(filter: {
  name?: string;
  id?: string;
}): Promise<PublicBuilderRow[]> {
  const api = await rest();
  try {
    const params: Record<string, string> = {
      select: 'id,name',
      limit: '5',
    };
    if (filter.id) {
      params.id = `eq.${filter.id}`;
    }
    if (filter.name) {
      params.name = `eq.${filter.name}`;
    }

    const res = await api.get('/rest/v1/builders', { params });
    if (res.status() !== 200) {
      throw new Error(
        `GET /rest/v1/builders failed (${res.status()}): ${await res.text()}`,
      );
    }

    const rows = await res.json();
    return Array.isArray(rows) ? rows : [];
  } finally {
    await api.dispose();
  }
}

/**
 * Poll until the public builders API returns the Admin-created row.
 * Use this as a gate before asserting the builder on the user site.
 */
export async function waitUntilPublicBuilderExists(
  filter: { name?: string; id?: string },
  timeoutMs = 20_000,
): Promise<PublicBuilderRow> {
  let found: PublicBuilderRow | undefined;

  await expect
    .poll(
      async () => {
        const rows = await fetchPublicBuilders(filter);
        found = rows[0];
        return rows.length;
      },
      { timeout: timeoutMs, intervals: [500, 1_000, 2_000] },
    )
    .toBeGreaterThan(0);

  if (!found) {
    throw new Error(
      `Public builders API never returned ${JSON.stringify(filter)}`,
    );
  }
  return found;
}

export type PublicProjectRow = { id: string; name: string; builder_id: string };

/** Anon GET /rest/v1/projects — the same surface the user site can read. */
export async function fetchPublicProjects(filter: {
  name?: string;
  id?: string;
}): Promise<PublicProjectRow[]> {
  const api = await rest();
  try {
    const params: Record<string, string> = {
      select: 'id,name,builder_id',
      limit: '5',
    };
    if (filter.id) {
      params.id = `eq.${filter.id}`;
    }
    if (filter.name) {
      params.name = `eq.${filter.name}`;
    }

    const res = await api.get('/rest/v1/projects', { params });
    if (res.status() !== 200) {
      throw new Error(
        `GET /rest/v1/projects failed (${res.status()}): ${await res.text()}`,
      );
    }

    const rows = await res.json();
    return Array.isArray(rows) ? rows : [];
  } finally {
    await api.dispose();
  }
}

/**
 * Poll until the public projects API returns the Admin-created row.
 * Use this as a gate before asserting the project on the user site.
 */
export async function waitUntilPublicProjectExists(
  filter: { name?: string; id?: string },
  timeoutMs = 20_000,
): Promise<PublicProjectRow> {
  let found: PublicProjectRow | undefined;

  await expect
    .poll(
      async () => {
        const rows = await fetchPublicProjects(filter);
        found = rows[0];
        return rows.length;
      },
      { timeout: timeoutMs, intervals: [500, 1_000, 2_000] },
    )
    .toBeGreaterThan(0);

  if (!found) {
    throw new Error(
      `Public projects API never returned ${JSON.stringify(filter)}`,
    );
  }
  return found;
}
