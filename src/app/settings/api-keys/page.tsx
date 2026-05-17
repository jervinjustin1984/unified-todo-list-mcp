import { listApiKeysForUser } from "@/lib/api-keys";
import { getSessionUserId } from "@/lib/session";
import { ApiKeysClient } from "./api-keys-client";

export default async function ApiKeysPage() {
  const userId = await getSessionUserId();
  if (!userId) {
    return null;
  }

  let keys: Awaited<ReturnType<typeof listApiKeysForUser>> = [];
  let loadError: string | null = null;

  try {
    keys = await listApiKeysForUser(userId);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Failed to load API keys";
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-xl font-semibold">API keys</h1>
        <p className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm">
          Could not load API keys: {loadError}
        </p>
        <p className="mt-3 text-sm text-foreground/70">
          Run migration{" "}
          <code className="rounded bg-foreground/10 px-1">
            20250519120000_user_api_keys.sql
          </code>{" "}
          in Supabase if the table is missing.
        </p>
      </main>
    );
  }

  return <ApiKeysClient keys={keys} />;
}
