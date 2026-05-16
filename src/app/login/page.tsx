import { LoginForm } from "./login-form";

type Props = {
  searchParams: Promise<{ error?: string; oauth?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const isOAuth = params.oauth === "1";

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-foreground/70">
        {isOAuth
          ? "Sign in to connect your MCP client (e.g. Claude) to your todos."
          : "Use the account created in Supabase Auth (Dashboard → Authentication)."}
      </p>
      {params.error === "auth" ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">
          Sign-in failed. Try again.
        </p>
      ) : null}
      <div className="mt-8">
        <LoginForm />
      </div>
    </main>
  );
}
