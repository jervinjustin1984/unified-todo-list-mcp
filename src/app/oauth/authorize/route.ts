import { NextResponse } from "next/server";
import { parseAuthorizeSearchParams } from "@/lib/mcp-oauth/authorize-params";
import { getClient, isRedirectUriAllowed } from "@/lib/mcp-oauth/clients";
import { oauthRedirectError } from "@/lib/mcp-oauth/errors";
import { completeAuthorize } from "@/lib/mcp-oauth/complete-authorize";
import { getAppOrigin } from "@/lib/mcp-oauth/origin";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = getAppOrigin(req);
  const parsed = parseAuthorizeSearchParams(url.searchParams);

  if ("error" in parsed) {
    return NextResponse.json(
      { error: parsed.error, error_description: parsed.description },
      { status: 400 },
    );
  }

  const client = await getClient(parsed.client_id);
  if (!client) {
    return NextResponse.json(
      { error: "invalid_client", error_description: "Unknown client_id" },
      { status: 400 },
    );
  }

  if (!isRedirectUriAllowed(client, parsed.redirect_uri)) {
    return oauthRedirectError(
      parsed.redirect_uri,
      "invalid_request",
      "redirect_uri not registered for this client",
      parsed.state,
    );
  }

  return completeAuthorize(parsed, origin);
}
