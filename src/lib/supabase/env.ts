export function getSupabaseUrl(): string {
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
  }
  return url.replace(/\/$/, "");
}

export function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return key;
}

export function getSupabaseIssuer(): string {
  return `${getSupabaseUrl()}/auth/v1`;
}

export function getSupabaseJwksUrl(): string {
  return `${getSupabaseIssuer()}/.well-known/jwks.json`;
}
