import { listTodos } from "@/lib/todos-service";
import { TodoClient } from "./todo-client";

export default async function Home() {
  let activeTodos: Awaited<ReturnType<typeof listTodos>> = [];
  let archivedTodos: Awaited<ReturnType<typeof listTodos>> = [];
  let loadError: string | null = null;

  try {
    [activeTodos, archivedTodos] = await Promise.all([
      listTodos({ includeArchived: false }),
      listTodos({ archivedOnly: true }),
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
          Set <code className="rounded bg-foreground/10 px-1">SUPABASE_URL</code>{" "}
          and{" "}
          <code className="rounded bg-foreground/10 px-1">
            SUPABASE_SERVICE_ROLE_KEY
          </code>{" "}
          in <code className="rounded bg-foreground/10 px-1">.env.local</code>,
          run the SQL migration in Supabase, then refresh.
        </p>
      </main>
    );
  }

  return <TodoClient activeTodos={activeTodos} archivedTodos={archivedTodos} />;
}
