import { NextRequest, NextResponse } from "next/server";
import { safeNextPath } from "@/lib/auth-next-path";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (!code) {
    return redirectToLogin(request, next);
  }

  const redirectTo = new URL(next, request.url);
  const response = NextResponse.redirect(redirectTo);
  const supabase = createRouteHandlerClient(request, response);

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession:", error.message);
    return redirectToLogin(request, next);
  }

  return response;
}

function redirectToLogin(request: NextRequest, next: string): NextResponse {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", next === "/reset-password" ? "reset" : "auth");
  return NextResponse.redirect(url);
}
