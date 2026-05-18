import Link from "next/link";
import { LoginForm } from "./login-form";

type Props = {
  searchParams: Promise<{
    error?: string;
    error_code?: string;
    error_description?: string;
    oauth?: string;
  }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const isOAuth = params.oauth === "1";
  const signupHref = isOAuth ? "/signup?oauth=1" : "/signup";

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-foreground/70">
        {isOAuth
          ? "Sign in to connect your MCP client (e.g. Claude) to your todos."
          : "Sign in with your email and password."}
      </p>
      {params.error === "auth" ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">
          Sign-in failed. Try again.
        </p>
      ) : null}
      {params.error === "reset" || params.error_code === "otp_expired" ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">
          {params.error_description?.replace(/\+/g, " ") ??
            "Password reset link is invalid or expired. Request a new one below."}
        </p>
      ) : null}
      {params.error === "oauth_server" ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">
          Could not complete MCP connection. Ensure the{" "}
          <code className="text-xs">mcp_oauth</code> migration has been applied in
          Supabase, then try Connect again in Claude.
        </p>
      ) : null}
      <div className="mt-8">
        <LoginForm />
      </div>
      <p className="mt-4 text-sm">
        <Link
          href="/forgot-password"
          className="text-foreground/80 underline hover:text-foreground"
        >
          Forgot password?
        </Link>
      </p>
      <p className="mt-6 text-sm text-foreground/70">
        Don&apos;t have an account?{" "}
        <Link href={signupHref} className="font-medium text-foreground underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
