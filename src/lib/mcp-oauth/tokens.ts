import { createClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { consumeAuthorizationCode } from "@/lib/mcp-oauth/codes";
import { verifyPkceS256 } from "@/lib/mcp-oauth/pkce";

export type TokenResponse = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
};

function parseJwtExpiry(accessToken: string): number {
  try {
    const payload = JSON.parse(
      Buffer.from(accessToken.split(".")[1] ?? "", "base64url").toString("utf8"),
    ) as { exp?: number };
    if (typeof payload.exp === "number") {
      return Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
    }
  } catch {
    /* fall through */
  }
  return 3600;
}

export async function exchangeAuthorizationCode(input: {
  code: string;
  clientId: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<TokenResponse | { error: string; description: string }> {
  const consumed = await consumeAuthorizationCode(
    input.code,
    input.clientId,
    input.redirectUri,
  );

  if (!consumed) {
    return { error: "invalid_grant", description: "Invalid or expired code" };
  }

  if (consumed.codeChallengeMethod !== "S256") {
    return {
      error: "invalid_grant",
      description: "Unsupported code challenge method",
    };
  }

  if (!verifyPkceS256(input.codeVerifier, consumed.codeChallenge)) {
    return { error: "invalid_grant", description: "PKCE verification failed" };
  }

  return {
    access_token: consumed.accessToken,
    token_type: "Bearer",
    expires_in: parseJwtExpiry(consumed.accessToken),
    refresh_token: consumed.refreshToken,
  };
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<TokenResponse | { error: string; description: string }> {
  const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    return {
      error: "invalid_grant",
      description: error?.message ?? "Refresh failed",
    };
  }

  return {
    access_token: data.session.access_token,
    token_type: "Bearer",
    expires_in: data.session.expires_in ?? parseJwtExpiry(data.session.access_token),
    refresh_token: data.session.refresh_token,
  };
}
