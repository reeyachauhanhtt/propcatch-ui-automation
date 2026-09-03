import { request, type APIRequestContext } from '@playwright/test';

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
