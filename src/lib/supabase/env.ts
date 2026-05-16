/** Env helpers for Supabase (server, edge middleware, and browser). */

import {
  assertClientAnonKey,
  assertServiceRoleKey,
} from "@/lib/supabase/validate-keys";

export function getSupabaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  if (!url) {
    throw new Error(
      "Missing Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_URL.",
    );
  }
  return url.replace(/\/$/, "");
}

/** Anon/publishable key for session clients (browser + middleware). */
export function getSupabaseAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      "Missing Supabase anon key. Set NEXT_PUBLIC_SUPABASE_ANON_KEY and/or SUPABASE_ANON_KEY.",
    );
  }
  assertClientAnonKey(
    key,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? "NEXT_PUBLIC_SUPABASE_ANON_KEY"
      : "SUPABASE_ANON_KEY",
  );
  return key;
}

/** Server-only service role / secret key (never use in browser or NEXT_PUBLIC_*). */
export function getSupabaseServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  assertServiceRoleKey(key);
  return key;
}

/**
 * Safe read for Edge middleware — returns null instead of throwing so we can
 * return a clear 503 instead of MIDDLEWARE_INVOCATION_FAILED.
 */
export function getSupabaseMiddlewareConfig(): {
  url: string;
  anonKey: string;
} | null {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return null;
  }
  return { url: url.replace(/\/$/, ""), anonKey };
}

export function getSupabaseIssuer(): string {
  return `${getSupabaseUrl()}/auth/v1`;
}

export function getSupabaseJwksUrl(): string {
  return `${getSupabaseIssuer()}/.well-known/jwks.json`;
}
