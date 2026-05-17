"use client";

import { useActionState } from "react";
import { updatePasswordAction, type ResetPasswordState } from "./actions";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState<
    ResetPasswordState,
    FormData
  >(updatePasswordAction, null);

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        New password
        <input
          type="password"
          name="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="rounded-md border border-foreground/20 bg-background px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Confirm new password
        <input
          type="password"
          name="confirmPassword"
          required
          minLength={6}
          autoComplete="new-password"
          className="rounded-md border border-foreground/20 bg-background px-3 py-2"
        />
      </label>
      {state?.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
