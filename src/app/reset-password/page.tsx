import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
      {user ? (
        <>
          <p className="mt-2 text-sm text-foreground/70">
            Enter a new password for your account.
          </p>
          <div className="mt-8">
            <ResetPasswordForm />
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-foreground/70">
            Open the reset link from your email, or request a new one if the link
            expired.
          </p>
          <p className="mt-6 text-sm">
            <Link
              href="/forgot-password"
              className="font-medium text-foreground underline"
            >
              Request a new reset link
            </Link>
          </p>
        </>
      )}
      <p className="mt-6 text-sm text-foreground/70">
        <Link href="/login" className="font-medium text-foreground underline">
          Back to sign in
        </Link>
      </p>
    </main>
  );
}
