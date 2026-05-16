import { listTodosForSession } from "@/lib/todos-service-web";
import { getSessionUserId } from "@/lib/session";
import { TodoClient } from "./todo-client";

export default async function Home() {
  const userId = await getSessionUserId();
  if (!userId) {
    return null;
  }

  let activeTodos: Awaited<ReturnType<typeof listTodosForSession>> = [];
  let archivedTodos: Awaited<ReturnType<typeof listTodosForSession>> = [];
  let loadError: string | null = null;

  try {
    [activeTodos, archivedTodos] = await Promise.all([
      listTodosForSession({ includeArchived: false }),
      listTodosForSession({ archivedOnly: true }),
    ]);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Failed to load todos";
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-xl font-semibold">Todos</h1>
        <p className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm">
          Could not load todos: {loadError}
        </p>
        <p className="mt-3 text-sm text-foreground/70">
          If you migrated from the old schema, backfill{" "}
          <code className="rounded bg-foreground/10 px-1">user_id</code> to your
          auth user UUID in Supabase (see README), then refresh.
        </p>
      </main>
    );
  }

  return <TodoClient activeTodos={activeTodos} archivedTodos={archivedTodos} />;
}
