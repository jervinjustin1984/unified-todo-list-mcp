"use client";

import Link from "next/link";
import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  createApiKeyAction,
  revokeApiKeyAction,
  type ApiKeyActionResult,
} from "@/app/settings/api-keys/actions";
import type { UserApiKey } from "@/lib/api-keys";

function CreateKeyFields() {
  const { pending } = useFormStatus();
  return (
    <>
      <input
        name="name"
        type="text"
        required
        placeholder="e.g. Siri iPhone"
        className="min-w-0 flex-1 rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm outline-none ring-foreground/30 focus:ring-2"
        disabled={pending}
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
      >
        Create key
      </button>
    </>
  );
}

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

type Props = {
  keys: UserApiKey[];
};

export function ApiKeysClient({ keys }: Props) {
  const [pending, startTransition] = useTransition();
  const [createState, createFormAction] = useActionState<
    ApiKeyActionResult | null,
    FormData
  >(createApiKeyAction, null);

  function handleRevoke(keyId: string) {
    if (!confirm("Revoke this API key? Shortcuts using it will stop working.")) {
      return;
    }
    startTransition(async () => {
      const result = await revokeApiKeyAction(keyId);
      if (!result.ok) {
        alert(result.error);
      }
    });
  }

  async function copySecret(secret: string) {
    try {
      await navigator.clipboard.writeText(secret);
    } catch {
      alert("Could not copy to clipboard");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <Link
          href="/"
          className="w-fit text-sm text-foreground/60 underline hover:text-foreground"
        >
          ← Todos
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">API keys</h1>
        <p className="text-sm text-foreground/70">
          Personal Bearer tokens for REST, MCP, and Apple Shortcuts. Use{" "}
          <code className="rounded bg-foreground/10 px-1">
            Authorization: Bearer utl_…
          </code>
          . Full secret is listed below (v1 — you may harden storage later).
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/60">
          Create
        </h2>
        <form className="flex flex-col gap-2" action={createFormAction}>
          <div className="flex gap-2">
            <CreateKeyFields />
          </div>
          {createState && !createState.ok ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              {createState.error}
            </p>
          ) : null}
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/60">
          Your keys
        </h2>
        {keys.length === 0 ? (
          <p className="text-sm text-foreground/60">No API keys yet.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {keys.map((key) => (
              <li
                key={key.id}
                className="flex flex-col gap-3 rounded-md border border-foreground/15 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{key.name}</p>
                    <p className="mt-1 text-xs text-foreground/60">
                      Created {formatWhen(key.createdAt)}
                      {key.lastUsedAt
                        ? ` · Last used ${formatWhen(key.lastUsedAt)}`
                        : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleRevoke(key.id)}
                    className="shrink-0 text-sm text-red-600 underline hover:opacity-80 disabled:opacity-50 dark:text-red-400"
                  >
                    Revoke
                  </button>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <code className="block flex-1 break-all rounded bg-foreground/5 px-2 py-2 text-xs">
                    {key.secret}
                  </code>
                  <button
                    type="button"
                    onClick={() => copySecret(key.secret)}
                    className="shrink-0 rounded-md border border-foreground/20 px-3 py-2 text-sm hover:bg-foreground/5"
                  >
                    Copy
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm text-foreground/60">
        Siri setup: see{" "}
        <code className="rounded bg-foreground/10 px-1">docs/siri-shortcuts.md</code>{" "}
        in the repo (or README).
      </p>
    </main>
  );
}
