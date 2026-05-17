"use server";

import { createClient } from "@/lib/supabase/server";
import { redirectAfterAuth } from "@/lib/auth-redirect";
import { validatePasswordPair } from "@/lib/auth-password";

export type SignUpState = { error?: string } | null;

export async function signUpAction(
  _prev: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!email) {
    return { error: "Email is required" };
  }

  const passwordError = validatePasswordPair(password, confirmPassword);
  if (passwordError) {
    return { error: passwordError };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  return redirectAfterAuth();
}
