import { NextResponse } from "next/server";

const BEARER = /^Bearer\s+(.+)$/i;

export function getBearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  if (!h) return null;
  const m = BEARER.exec(h);
  return m?.[1]?.trim() ?? null;
}

export function requireApiKey(request: Request): NextResponse | null {
  const expected = process.env.API_KEY;
  if (!expected) {
    return NextResponse.json(
      { error: { message: "Server misconfiguration: API_KEY is not set" } },
      { status: 500 },
    );
  }
  const token = getBearerToken(request);
  if (token !== expected) {
    return NextResponse.json(
      { error: { message: "Unauthorized", code: "unauthorized" } },
      { status: 401 },
    );
  }
  return null;
}
