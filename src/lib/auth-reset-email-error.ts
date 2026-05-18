/** User-facing message for Supabase resetPasswordForEmail failures. */
export function mapResetPasswordEmailError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("rate limit")) {
    return "Too many reset emails were sent. Wait a few minutes and try again. Supabase limits how many auth emails a project can send per hour.";
  }

  if (lower.includes("redirect") || lower.includes("redirect_to")) {
    return "Password reset is misconfigured: add your app origin’s /auth/confirm URL to Supabase Auth redirect URLs (see README).";
  }

  if (lower.includes("invalid") && lower.includes("email")) {
    return message;
  }

  return message;
}
