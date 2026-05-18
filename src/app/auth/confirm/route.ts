import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { safeNextPath } from "@/lib/auth-next-path";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"), "/reset-password");

  const redirectTo = new URL(next, request.url);
  const response = NextResponse.redirect(redirectTo);
  const supabase = createRouteHandlerClient(request, response);

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return response;
    }
    console.error("[auth/confirm] verifyOtp:", error.message);
    return redirectToLogin(request, next);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
    console.error("[auth/confirm] exchangeCodeForSession:", error.message);
    return redirectToLogin(request, next);
  }

  console.error("[auth/confirm] missing token_hash/type and code");
  return redirectToLogin(request, next);
}

function redirectToLogin(request: NextRequest, next: string): NextResponse {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", next === "/reset-password" ? "reset" : "auth");
  return NextResponse.redirect(url);
}
