import Link from "next/link";
import { SignUpForm } from "./signup-form";

type Props = {
  searchParams: Promise<{ oauth?: string }>;
};

export default async function SignUpPage({ searchParams }: Props) {
  const params = await searchParams;
  const isOAuth = params.oauth === "1";
  const loginHref = isOAuth ? "/login?oauth=1" : "/login";

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
      <p className="mt-2 text-sm text-foreground/70">
        {isOAuth
          ? "Create an account to connect your MCP client (e.g. Claude) to your todos."
          : "Sign up with your email and a password."}
      </p>
      <div className="mt-8">
        <SignUpForm />
      </div>
      <p className="mt-6 text-sm text-foreground/70">
        Already have an account?{" "}
        <Link href={loginHref} className="font-medium text-foreground underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
