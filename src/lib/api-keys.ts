import { randomBytes, timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "@/lib/db";

export const API_KEY_PREFIX = "utl_";

export type UserApiKeyRow = {
  id: string;
  user_id: string;
  name: string;
  secret: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

export type UserApiKey = {
  id: string;
  userId: string;
  name: string;
  secret: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

function rowToKey(row: UserApiKeyRow): UserApiKey {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    secret: row.secret,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
    revokedAt: row.revoked_at,
  };
}

export function generateApiKeySecret(): string {
  return `${API_KEY_PREFIX}${randomBytes(32).toString("base64url")}`;
}

export function isPersonalApiKey(token: string): boolean {
  return token.startsWith(API_KEY_PREFIX);
}

function secretsEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    timingSafeEqual(ba, ba);
    return false;
  }
  return timingSafeEqual(ba, bb);
}

export async function verifyPersonalApiKey(
  token: string,
): Promise<{ userId: string; keyId: string } | null> {
  if (!isPersonalApiKey(token)) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("user_api_keys")
    .select("id, user_id, secret")
    .is("revoked_at", null)
    .eq("secret", token)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as Pick<UserApiKeyRow, "id" | "user_id" | "secret">;
  if (!secretsEqual(row.secret, token)) return null;

  const now = new Date().toISOString();
  await supabase
    .from("user_api_keys")
    .update({ last_used_at: now })
    .eq("id", row.id);

  return { userId: row.user_id, keyId: row.id };
}

export async function listApiKeysForUser(userId: string): Promise<UserApiKey[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("user_api_keys")
    .select("*")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as UserApiKeyRow[]).map(rowToKey);
}

export async function createApiKeyForUser(
  userId: string,
  name: string,
): Promise<UserApiKey> {
  const supabase = getSupabaseAdmin();
  const secret = generateApiKeySecret();
  const trimmedName = name.trim() || "API key";

  const { data, error } = await supabase
    .from("user_api_keys")
    .insert({
      user_id: userId,
      name: trimmedName,
      secret,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToKey(data as UserApiKeyRow);
}

export async function revokeApiKeyForUser(
  keyId: string,
  userId: string,
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("user_api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("user_id", userId)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data);
}
