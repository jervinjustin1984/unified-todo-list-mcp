"use server";

import { createClient } from "@/lib/supabase/server";
import { getSiteOrigin } from "@/lib/app-origin";
import { mapResetPasswordEmailError } from "@/lib/auth-reset-email-error";

export type ForgotPasswordState =
  | { error?: string; success?: boolean }
  | null;

export async function requestPasswordResetAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Email is required" };
  }

  const supabase = await createClient();
  const origin = await getSiteOrigin();
  const redirectTo = `${origin}/auth/confirm?next=${encodeURIComponent("/reset-password")}`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    console.error("[forgot-password] resetPasswordForEmail:", error.message);
    return { error: mapResetPasswordEmailError(error.message) };
  }

  return { success: true };
}
