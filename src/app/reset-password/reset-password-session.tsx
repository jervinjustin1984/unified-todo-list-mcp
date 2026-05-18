"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ResetPasswordForm } from "./reset-password-form";

type Props = {
  serverHasUser: boolean;
  noSessionFallback: React.ReactNode;
};

/**
 * Recovery links may deliver the session in the URL hash (implicit flow).
 * The browser client picks that up; this gate waits before showing the form.
 */
export function ResetPasswordSession({
  serverHasUser,
  noSessionFallback,
}: Props) {
  const [clientHasUser, setClientHasUser] = useState(serverHasUser);
  const [checking, setChecking] = useState(!serverHasUser);

  useEffect(() => {
    if (serverHasUser) {
      return;
    }

    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setClientHasUser(true);
        setChecking(false);
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setClientHasUser(true);
      }
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, [serverHasUser]);

  if (clientHasUser) {
    return (
      <>
        <p className="mt-2 text-sm text-foreground/70">
          Enter a new password for your account.
        </p>
        <div className="mt-8">
          <ResetPasswordForm />
        </div>
      </>
    );
  }

  if (checking) {
    return (
      <p className="mt-4 text-sm text-foreground/70">Verifying reset link…</p>
    );
  }

  return <>{noSessionFallback}</>;
}
