import { createClient } from "@/lib/supabase/server";
import { requireSessionUserId } from "@/lib/session";
import type {
  CreateTodoInput,
  ListTodosParams,
  UpdateTodoInput,
} from "@/lib/todos-service";
import {
  archiveTodo,
  createTodo,
  listTodos,
  restoreTodo,
  toggleTodoCompletedUi,
  updateTodo,
} from "@/lib/todos-service";

/** Web UI: use the logged-in user's Supabase session so RLS applies. */
async function sessionDb() {
  return createClient();
}

export async function listTodosForSession(
  params: Omit<ListTodosParams, "userId">,
) {
  const [supabase, userId] = await Promise.all([
    sessionDb(),
    requireSessionUserId(),
  ]);
  return listTodos({ ...params, userId }, supabase);
}

export async function createTodoForSession(
  input: Omit<CreateTodoInput, "userId">,
) {
  const [supabase, userId] = await Promise.all([
    sessionDb(),
    requireSessionUserId(),
  ]);
  return createTodo({ ...input, userId }, supabase);
}

export async function updateTodoForSession(
  id: string,
  patch: UpdateTodoInput,
) {
  const [supabase, userId] = await Promise.all([
    sessionDb(),
    requireSessionUserId(),
  ]);
  return updateTodo(id, patch, userId, supabase);
}

export async function archiveTodoForSession(id: string) {
  const [supabase, userId] = await Promise.all([
    sessionDb(),
    requireSessionUserId(),
  ]);
  return archiveTodo(id, userId, supabase);
}

export async function toggleTodoForSession(id: string) {
  const [supabase, userId] = await Promise.all([
    sessionDb(),
    requireSessionUserId(),
  ]);
  return toggleTodoCompletedUi(id, userId, supabase);
}

export async function restoreTodoForSession(id: string) {
  const [supabase, userId] = await Promise.all([
    sessionDb(),
    requireSessionUserId(),
  ]);
  return restoreTodo(id, userId, supabase);
}
