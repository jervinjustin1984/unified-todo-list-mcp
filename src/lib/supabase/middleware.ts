import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  authorizeQueryFromPending,
  MCP_OAUTH_PENDING_COOKIE,
  parsePendingParams,
} from "@/lib/mcp-oauth/pending";
import { getSupabaseMiddlewareConfig } from "@/lib/supabase/env";

const PUBLIC_PATHS = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
]);

const REDIRECT_IF_AUTHENTICATED = new Set([
  "/login",
  "/signup",
  "/forgot-password",
]);

function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith("/api")) return true;
  if (pathname.startsWith("/auth")) return true;
  if (pathname.startsWith("/oauth")) return true;
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/.well-known")) return true;
  return false;
}

function redirectAuthenticatedFromEntry(
  request: NextRequest,
): NextResponse | null {
  if (!REDIRECT_IF_AUTHENTICATED.has(request.nextUrl.pathname)) {
    return null;
  }

  const isOAuthEntry =
    request.nextUrl.searchParams.get("oauth") === "1" &&
    (request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/signup");

  if (isOAuthEntry) {
    const pending = request.cookies.get(MCP_OAUTH_PENDING_COOKIE)?.value;
    const params = pending ? parsePendingParams(pending) : null;
    if (params) {
      const url = request.nextUrl.clone();
      url.pathname = "/oauth/authorize";
      url.search = authorizeQueryFromPending(params);
      return NextResponse.redirect(url);
    }
  }

  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  const config = getSupabaseMiddlewareConfig();
  if (!config) {
    console.error(
      "[middleware] Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (and redeploy), or SUPABASE_URL + SUPABASE_ANON_KEY on Vercel.",
    );
    if (isPublicPath(request.nextUrl.pathname)) {
      return NextResponse.next();
    }
    return new NextResponse(
      "Server misconfiguration: Supabase environment variables are not set. See README.",
      { status: 503 },
    );
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("[middleware] getUser error:", error.message);
  }

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (user) {
    const entryRedirect = redirectAuthenticatedFromEntry(request);
    if (entryRedirect) {
      return entryRedirect;
    }
  }

  return supabaseResponse;
}
