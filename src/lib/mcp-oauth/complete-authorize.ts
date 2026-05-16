import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAuthorizationCode } from "@/lib/mcp-oauth/codes";
import {
  MCP_OAUTH_PENDING_COOKIE,
  serializePendingParams,
  type PendingAuthorizeParams,
} from "@/lib/mcp-oauth/pending";
import { getClient, isRedirectUriAllowed } from "@/lib/mcp-oauth/clients";
import { oauthRedirectError } from "@/lib/mcp-oauth/errors";

export async function completeAuthorize(
  params: PendingAuthorizeParams,
  origin: string,
): Promise<NextResponse> {
  const client = await getClient(params.client_id);
  if (!client) {
    return NextResponse.json(
      { error: "invalid_client", error_description: "Unknown client_id" },
      { status: 400 },
    );
  }

  if (!isRedirectUriAllowed(client, params.redirect_uri)) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "redirect_uri not registered for this client",
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("oauth", "1");
    const res = NextResponse.redirect(loginUrl);
    res.cookies.set(MCP_OAUTH_PENDING_COOKIE, serializePendingParams(params), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return res;
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token || !session.refresh_token) {
    return oauthRedirectError(
      params.redirect_uri,
      "server_error",
      "Session missing tokens — sign in again",
      params.state,
    );
  }

  let code: string;
  try {
    code = await createAuthorizationCode({
      clientId: params.client_id,
      userId: user.id,
      redirectUri: params.redirect_uri,
      codeChallenge: params.code_challenge,
      codeChallengeMethod: params.code_challenge_method,
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
    });
  } catch (err) {
    console.error("[oauth/authorize] createAuthorizationCode:", err);
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("oauth", "1");
    loginUrl.searchParams.set("error", "oauth_server");
    const res = NextResponse.redirect(loginUrl);
    res.cookies.set(MCP_OAUTH_PENDING_COOKIE, serializePendingParams(params), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return res;
  }

  const redirect = new URL(params.redirect_uri);
  redirect.searchParams.set("code", code);
  if (params.state) redirect.searchParams.set("state", params.state);

  const res = NextResponse.redirect(redirect.toString());
  res.cookies.delete(MCP_OAUTH_PENDING_COOKIE);
  return res;
}
