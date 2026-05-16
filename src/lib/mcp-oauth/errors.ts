import { NextResponse } from "next/server";

export function oauthJsonError(
  error: string,
  description: string,
  status: number,
  extra?: Record<string, string>,
) {
  return NextResponse.json(
    { error, error_description: description, ...extra },
    {
      status,
      headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
    },
  );
}

export function oauthRedirectError(
  redirectUri: string,
  error: string,
  description: string,
  state?: string | null,
) {
  const url = new URL(redirectUri);
  url.searchParams.set("error", error);
  url.searchParams.set("error_description", description);
  if (state) url.searchParams.set("state", state);
  return NextResponse.redirect(url.toString(), 302);
}
