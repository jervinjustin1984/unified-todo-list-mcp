import { NextResponse } from "next/server";
import { oauthJsonError } from "@/lib/mcp-oauth/errors";
import {
  exchangeAuthorizationCode,
  refreshAccessToken,
} from "@/lib/mcp-oauth/tokens";

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  let params: URLSearchParams;

  if (contentType.includes("application/json")) {
    const body = (await req.json()) as Record<string, string>;
    params = new URLSearchParams(body);
  } else {
    const text = await req.text();
    params = new URLSearchParams(text);
  }

  const grantType = params.get("grant_type");

  if (grantType === "authorization_code") {
    const code = params.get("code");
    const clientId = params.get("client_id");
    const redirectUri = params.get("redirect_uri");
    const codeVerifier = params.get("code_verifier");

    if (!code || !clientId || !redirectUri || !codeVerifier) {
      return oauthJsonError(
        "invalid_request",
        "code, client_id, redirect_uri, and code_verifier are required",
        400,
      );
    }

    const result = await exchangeAuthorizationCode({
      code,
      clientId,
      redirectUri,
      codeVerifier,
    });

    if ("error" in result) {
      return oauthJsonError(result.error, result.description, 400);
    }

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
    });
  }

  if (grantType === "refresh_token") {
    const refreshToken = params.get("refresh_token");
    if (!refreshToken) {
      return oauthJsonError(
        "invalid_request",
        "refresh_token is required",
        400,
      );
    }

    const result = await refreshAccessToken(refreshToken);
    if ("error" in result) {
      return oauthJsonError(result.error, result.description, 400);
    }

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
    });
  }

  return oauthJsonError(
    "unsupported_grant_type",
    "Supported: authorization_code, refresh_token",
    400,
  );
}
