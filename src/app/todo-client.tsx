"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTransition } from "react";
import {
  addTodoAction,
  archiveTodoAction,
  restoreTodoAction,
  signOutAction,
  toggleTodoCompletedAction,
  toggleTodoInProgressAction,
  type ActionResult,
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

function TodoRowTitle({ todo }: { todo: Todo }) {
  const isDone = todo.status === "completed";
  const isInProgress = todo.status === "in_progress";

  return (
    <span
      className={
        isDone
          ? "text-foreground/50 line-through"
          : isInProgress
            ? "text-amber-950 dark:text-amber-100/90"
            : undefined
      }
      {...(isInProgress
        ? { "aria-label": `${todo.name}, in progress` }
        : undefined)}
    >
      {isInProgress ? (
        <span className="text-foreground/45" aria-hidden>
          ~{" "}
        </span>
      ) : null}
      {todo.name}
      {todo.category ? (
        <span className="ml-2 text-xs text-foreground/50">({todo.category})</span>
      ) : null}
    </span>
  );
}

type ActiveTodoRowProps = {
  todo: Todo;
  pending: boolean;
  onToggleCompleted: () => void;
  onToggleInProgress: () => void;
  onArchive: () => void;
};

function ActiveTodoRow({
  todo,
  pending,
  onToggleCompleted,
  onToggleInProgress,
  onArchive,
}: ActiveTodoRowProps) {
  const isDone = todo.status === "completed";
  const isInProgress = todo.status === "in_progress";

  return (
    <li className="flex items-start gap-2 rounded-md border border-transparent px-1 py-1.5 hover:border-foreground/10">
      <input
        type="checkbox"
        className="mt-1 size-4 shrink-0 accent-foreground"
        checked={isDone}
        disabled={pending}
        aria-label={
          isDone ? `Mark "${todo.name}" not done` : `Mark "${todo.name}" done`
        }
        onChange={onToggleCompleted}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <TodoRowTitle todo={todo} />
          {!isDone ? (
            <button
              type="button"
              disabled={pending}
              title={isInProgress ? "Mark not started" : "Mark in progress"}
              aria-label={
                isInProgress ? "Mark not started" : "Mark in progress"
              }
              className="mt-0.5 shrink-0 rounded px-1 text-sm leading-none text-foreground/35 hover:bg-foreground/10 hover:text-foreground/70 disabled:opacity-50"
              onClick={onToggleInProgress}
            >
              {isInProgress ? "■" : "▶"}
            </button>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        className="mt-0.5 shrink-0 text-xs text-foreground/50 underline hover:text-foreground"
        disabled={pending}
        onClick={onArchive}
      >
        Archive
      </button>
    </li>
  );
}

type Props = {
  activeTodos: Todo[];
  archivedTodos: Todo[];
};

export function TodoClient({ activeTodos, archivedTodos }: Props) {
  const [pending, startTransition] = useTransition();
  const [addState, addFormAction] = useActionState<ActionResult | null, FormData>(
    addTodoAction,
    null,
  );

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-4 py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Todos</h1>
          <p className="mt-1 text-sm text-foreground/70">
            Checkbox marks done; ▶ marks in progress (~). Strikethrough =
            finished.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link
            href="/settings/api-keys"
            className="text-sm text-foreground/60 underline hover:text-foreground"
          >
            API keys
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="text-sm text-foreground/60 underline hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/60">
          Add
        </h2>
        <form className="flex flex-col gap-2" action={addFormAction}>
          <div className="flex gap-2">
            <AddTodoFields />
          </div>
          {addState && !addState.ok ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              {addState.error}
            </p>
          ) : null}
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
              <ActiveTodoRow
                key={todo.id}
                todo={todo}
                pending={pending}
                onToggleCompleted={() => {
                  startTransition(async () => {
                    await toggleTodoCompletedAction(todo.id);
                  });
                }}
                onToggleInProgress={() => {
                  startTransition(async () => {
                    await toggleTodoInProgressAction(todo.id);
                  });
                }}
                onArchive={() => {
                  startTransition(async () => {
                    await archiveTodoAction(todo.id);
                  });
                }}
              />
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
