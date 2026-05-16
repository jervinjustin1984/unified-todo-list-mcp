"use client";

import { useFormStatus } from "react-dom";
import { useTransition } from "react";
import {
  addTodoAction,
  archiveTodoAction,
  restoreTodoAction,
  toggleTodoAction,
} from "@/app/actions";
import type { Todo } from "@/lib/types";

function AddTodoFields() {
  const { pending } = useFormStatus();
  return (
    <>
      <input
        name="name"
        type="text"
        required
        placeholder="New todo…"
        className="min-w-0 flex-1 rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm outline-none ring-foreground/30 focus:ring-2"
        disabled={pending}
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
      >
        Add
      </button>
    </>
  );
}

type Props = {
  activeTodos: Todo[];
  archivedTodos: Todo[];
};

export function TodoClient({ activeTodos, archivedTodos }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Todos</h1>
        <p className="mt-1 text-sm text-foreground/70">
          Active items (newest first). Checkbox toggles open ↔ completed.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/60">
          Add
        </h2>
        <form className="flex gap-2" action={addTodoAction}>
          <AddTodoFields />
        </form>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/60">
          Active
        </h2>
        {activeTodos.length === 0 ? (
          <p className="text-sm text-foreground/60">No active todos.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {activeTodos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-start gap-3 rounded-md border border-transparent px-1 py-1.5 hover:border-foreground/10"
              >
                <label className="flex flex-1 cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 shrink-0 accent-foreground"
                    checked={todo.status === "completed"}
                    disabled={pending}
                    onChange={() => {
                      startTransition(async () => {
                        await toggleTodoAction(todo.id);
                      });
                    }}
                  />
                  <span
                    className={
                      todo.status === "completed"
                        ? "text-foreground/50 line-through"
                        : ""
                    }
                  >
                    {todo.name}
                    {todo.category ? (
                      <span className="ml-2 text-xs text-foreground/50">
                        ({todo.category})
                      </span>
                    ) : null}
                    {todo.status === "in_progress" ? (
                      <span className="ml-2 rounded bg-foreground/10 px-1.5 py-0.5 text-xs">
                        In progress
                      </span>
                    ) : null}
                  </span>
                </label>
                <button
                  type="button"
                  className="shrink-0 text-xs text-foreground/50 underline hover:text-foreground"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      await archiveTodoAction(todo.id);
                    });
                  }}
                >
                  Archive
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <details className="rounded-md border border-foreground/15 p-3">
        <summary className="cursor-pointer text-sm font-medium">
          Archived ({archivedTodos.length})
        </summary>
        {archivedTodos.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/60">No archived todos.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {archivedTodos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="text-foreground/70 line-through">
                  {todo.name}
                </span>
                <button
                  type="button"
                  className="shrink-0 text-xs underline hover:text-foreground"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      await restoreTodoAction(todo.id);
                    });
                  }}
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        )}
      </details>
    </main>
  );
}
