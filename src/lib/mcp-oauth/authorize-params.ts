import type { PendingAuthorizeParams } from "@/lib/mcp-oauth/pending";

export function parseAuthorizeSearchParams(
  searchParams: URLSearchParams,
): PendingAuthorizeParams | { error: string; description: string } {
  const responseType = searchParams.get("response_type");
  const clientId = searchParams.get("client_id");
  const redirectUri = searchParams.get("redirect_uri");
  const codeChallenge = searchParams.get("code_challenge");
  const codeChallengeMethod =
    searchParams.get("code_challenge_method") ?? "S256";
  const state = searchParams.get("state") ?? undefined;

  if (responseType !== "code") {
    return {
      error: "unsupported_response_type",
      description: "Only response_type=code is supported",
    };
  }
  if (!clientId) {
    return { error: "invalid_request", description: "client_id is required" };
  }
  if (!redirectUri) {
    return { error: "invalid_request", description: "redirect_uri is required" };
  }
  if (!codeChallenge) {
    return {
      error: "invalid_request",
      description: "code_challenge is required (PKCE)",
    };
  }
  if (codeChallengeMethod !== "S256") {
    return {
      error: "invalid_request",
      description: "Only code_challenge_method=S256 is supported",
    };
  }

  return {
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod,
  };
}
