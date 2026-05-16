import { getSupabaseAdmin } from "@/lib/db";
import { decryptSecret, encryptSecret, randomToken } from "@/lib/mcp-oauth/crypto";

const CODE_TTL_MS = 5 * 60 * 1000;

export async function createAuthorizationCode(input: {
  clientId: string;
  userId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  accessToken: string;
  refreshToken: string;
}): Promise<string> {
  const code = randomToken(24);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("mcp_oauth_codes").insert({
    code,
    client_id: input.clientId,
    user_id: input.userId,
    redirect_uri: input.redirectUri,
    code_challenge: input.codeChallenge,
    code_challenge_method: input.codeChallengeMethod,
    access_token_enc: encryptSecret(input.accessToken),
    refresh_token_enc: encryptSecret(input.refreshToken),
    expires_at: expiresAt,
  });

  if (error) throw new Error(error.message);
  return code;
}

export type ConsumedCode = {
  accessToken: string;
  refreshToken: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
};

export async function consumeAuthorizationCode(
  code: string,
  clientId: string,
  redirectUri: string,
): Promise<ConsumedCode | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("mcp_oauth_codes")
    .select("*")
    .eq("code", code)
    .eq("client_id", clientId)
    .is("used_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  if (new Date(data.expires_at).getTime() < Date.now()) return null;
  if (data.redirect_uri !== redirectUri) return null;

  const { error: markError } = await supabase
    .from("mcp_oauth_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("code", code)
    .is("used_at", null);

  if (markError) throw new Error(markError.message);

  return {
    accessToken: decryptSecret(data.access_token_enc),
    refreshToken: decryptSecret(data.refresh_token_enc),
    clientId: data.client_id,
    redirectUri: data.redirect_uri,
    codeChallenge: data.code_challenge,
    codeChallengeMethod: data.code_challenge_method,
  };
}
