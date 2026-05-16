/** Catch common copy-paste mistakes before Supabase returns "Invalid API Key". */

function decodeJwtRole(key: string): string | null {
  try {
    const part = key.split(".")[1];
    if (!part) return null;
    const json = Buffer.from(part, "base64url").toString("utf8");
    const payload = JSON.parse(json) as { role?: string };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export function assertClientAnonKey(key: string, varName: string): void {
  if (key.startsWith("sk_live_") || key.startsWith("sk_test_")) {
    throw new Error(
      `${varName} looks like a Stripe secret key. Use Supabase anon or publishable key from Dashboard → API Keys.`,
    );
  }
  if (key.startsWith("sb_secret_")) {
    throw new Error(
      `${varName} is a Supabase secret key. Use the publishable or legacy anon key for browser login.`,
    );
  }
  const role = decodeJwtRole(key);
  if (role === "service_role") {
    throw new Error(
      `${varName} is the service_role JWT. Use the anon key for login (never put service_role in NEXT_PUBLIC_*).`,
    );
  }
}

export function assertServiceRoleKey(key: string): void {
  if (key.startsWith("sk_live_") || key.startsWith("sk_test_")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY looks like a Stripe key. Use Supabase secret/service_role from Dashboard → API Keys.",
    );
  }
  if (key.startsWith("sb_publishable_")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is a publishable key. Use the secret key (sb_secret_...) or legacy service_role JWT.",
    );
  }
  const role = decodeJwtRole(key);
  if (role === "anon") {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is the anon key. Use service_role or sb_secret_ from Supabase → API Keys.",
    );
  }
}
