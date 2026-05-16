export type PendingAuthorizeParams = {
  client_id: string;
  redirect_uri: string;
  state?: string;
  code_challenge: string;
  code_challenge_method: string;
};

export const MCP_OAUTH_PENDING_COOKIE = "mcp_oauth_pending";

export function serializePendingParams(params: PendingAuthorizeParams): string {
  return JSON.stringify(params);
}

export function parsePendingParams(raw: string): PendingAuthorizeParams | null {
  try {
    const parsed = JSON.parse(raw) as PendingAuthorizeParams;
    if (
      typeof parsed.client_id !== "string" ||
      typeof parsed.redirect_uri !== "string" ||
      typeof parsed.code_challenge !== "string"
    ) {
      return null;
    }
    return {
      client_id: parsed.client_id,
      redirect_uri: parsed.redirect_uri,
      state: parsed.state,
      code_challenge: parsed.code_challenge,
      code_challenge_method: parsed.code_challenge_method ?? "S256",
    };
  } catch {
    return null;
  }
}

export function authorizeQueryFromPending(
  params: PendingAuthorizeParams,
): string {
  const q = new URLSearchParams({
    response_type: "code",
    client_id: params.client_id,
    redirect_uri: params.redirect_uri,
    code_challenge: params.code_challenge,
    code_challenge_method: params.code_challenge_method,
  });
  if (params.state) q.set("state", params.state);
  return q.toString();
}
