import { createRemoteJWKSet, jwtVerify } from "jose";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { NextResponse } from "next/server";
import {
  getSupabaseIssuer,
  getSupabaseJwksUrl,
} from "@/lib/supabase/env";

const BEARER = /^Bearer\s+(.+)$/i;

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(getSupabaseJwksUrl()));
  }
  return jwks;
}

export type AuthUser = {
  userId: string;
  email?: string;
};

export function getBearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  if (!h) return null;
  const m = BEARER.exec(h);
  return m?.[1]?.trim() ?? null;
}

export async function verifySupabaseAccessToken(
  token: string,
): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwks(), {
      issuer: getSupabaseIssuer(),
      audience: "authenticated",
    });

    const sub = payload.sub;
    if (!sub || typeof sub !== "string") return null;

    const role = payload.role;
    if (role !== undefined && role !== "authenticated") return null;

    return {
      userId: sub,
      email:
        typeof payload.email === "string" ? payload.email : undefined,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(
  request: Request,
): Promise<AuthUser | NextResponse> {
  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json(
      { error: { message: "Unauthorized", code: "unauthorized" } },
      { status: 401 },
    );
  }

  const user = await verifySupabaseAccessToken(token);
  if (!user) {
    return NextResponse.json(
      { error: { message: "Invalid or expired token", code: "unauthorized" } },
      { status: 401 },
    );
  }

  return user;
}

export async function verifyMcpBearerToken(
  _req: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined;

  const user = await verifySupabaseAccessToken(bearerToken);
  if (!user) return undefined;

  return {
    token: bearerToken,
    clientId: user.userId,
    scopes: [],
    extra: { userId: user.userId, email: user.email },
  };
}

export function userIdFromMcpExtra(extra: {
  authInfo?: AuthInfo;
}): string | null {
  const id =
    extra.authInfo?.clientId ??
    (extra.authInfo?.extra?.userId as string | undefined);
  return id ?? null;
}
