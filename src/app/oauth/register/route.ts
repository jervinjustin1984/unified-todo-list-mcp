import { NextResponse } from "next/server";
import { registerClient } from "@/lib/mcp-oauth/clients";
import { oauthJsonError } from "@/lib/mcp-oauth/errors";

export async function POST(req: Request) {
  let body: {
    redirect_uris?: string[];
    client_name?: string;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return oauthJsonError(
      "invalid_request",
      "Request body must be JSON",
      400,
    );
  }

  const redirectUris = body.redirect_uris;
  if (!Array.isArray(redirectUris) || redirectUris.length === 0) {
    return oauthJsonError(
      "invalid_redirect_uri",
      "redirect_uris must be a non-empty array",
      400,
    );
  }

  for (const uri of redirectUris) {
    if (typeof uri !== "string") {
      return oauthJsonError(
        "invalid_redirect_uri",
        "Each redirect_uri must be a string",
        400,
      );
    }
    try {
      new URL(uri);
    } catch {
      return oauthJsonError(
        "invalid_redirect_uri",
        `Invalid redirect_uri: ${uri}`,
        400,
      );
    }
  }

  try {
    const client = await registerClient({
      redirect_uris: redirectUris,
      client_name: body.client_name,
    });

    return NextResponse.json(
      {
        client_id: client.client_id,
        client_id_issued_at: Math.floor(Date.now() / 1000),
        client_name: client.client_name,
        redirect_uris: client.redirect_uris,
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
      },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed";
    return oauthJsonError("server_error", message, 500);
  }
}
