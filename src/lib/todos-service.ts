import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/db";
import type { Todo, TodoPriority, TodoRow, TodoSource, TodoStatus } from "@/lib/types";

export function rowToTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    createdAt: row.created_at,
    status: row.status,
    priority: row.priority,
    category: row.category,
    source: row.source,
    completedAt: row.completed_at,
    archivedAt: row.archived_at,
  };
}

function assertUserId(userId: string | undefined): string {
  if (!userId) {
    throw new Error("userId is required");
  }
  return userId;
}

function db(client?: SupabaseClient): SupabaseClient {
  return client ?? getSupabaseAdmin();
}

export type ListTodosParams = {
  userId: string;
  q?: string;
  status?: TodoStatus;
  priority?: TodoPriority;
  category?: string;
  includeArchived?: boolean;
  archivedOnly?: boolean;
};

export async function listTodos(
  params: ListTodosParams,
  client?: SupabaseClient,
): Promise<Todo[]> {
  const userId = assertUserId(params.userId);
  const supabase = db(client);
  let query = supabase.from("todos").select("*").eq("user_id", userId);

  if (params.archivedOnly) {
    query = query.not("archived_at", "is", null);
  } else if (!params.includeArchived) {
    query = query.is("archived_at", null);
  }

  if (params.status) query = query.eq("status", params.status);
  if (params.priority) query = query.eq("priority", params.priority);
  if (params.category !== undefined && params.category !== "") {
    query = query.eq("category", params.category.trim());
  }
  if (params.q && params.q.trim()) {
    query = query.ilike("name", `%${params.q.trim()}%`);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as TodoRow[]).map(rowToTodo);
}

export type CreateTodoInput = {
  userId: string;
  name: string;
  source: TodoSource;
  status?: TodoStatus;
  priority?: TodoPriority;
  category?: string | null;
};

export async function createTodo(
  input: CreateTodoInput,
  client?: SupabaseClient,
): Promise<Todo> {
  const userId = assertUserId(input.userId);
  const supabase = db(client);
  const payload = {
    user_id: userId,
    name: input.name.trim(),
    source: input.source.trim(),
    status: input.status ?? "open",
    priority: input.priority ?? "medium",
    category: input.category?.trim() || null,
    completed_at:
      input.status === "completed" ? new Date().toISOString() : null,
  };
  const { data, error } = await supabase
    .from("todos")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return rowToTodo(data as TodoRow);
}

export type UpdateTodoInput = {
  name?: string;
  status?: TodoStatus;
  priority?: TodoPriority;
  category?: string | null | undefined;
  restore?: boolean;
};

function completedAtForStatus(
  next: TodoStatus,
  prev: TodoStatus,
): string | null | undefined {
  if (next === "completed") return new Date().toISOString();
  if (
    prev === "completed" &&
    (next === "open" || next === "in_progress")
  ) {
    return null;
  }
  return undefined;
}

export async function updateTodo(
  id: string,
  patch: UpdateTodoInput,
  userId: string,
  client?: SupabaseClient,
): Promise<Todo | null> {
  const uid = assertUserId(userId);
  const supabase = db(client);
  const { data: existing, error: fetchErr } = await supabase
    .from("todos")
    .select("*")
    .eq("id", id)
    .eq("user_id", uid)
    .maybeSingle();
  if (fetchErr) throw new Error(fetchErr.message);
  if (!existing) return null;

  const row = existing as TodoRow;
  const updates: Record<string, unknown> = {};

  if (patch.restore === true) {
    updates.archived_at = null;
  }
  if (patch.name !== undefined) updates.name = patch.name.trim();
  if (patch.priority !== undefined) updates.priority = patch.priority;
  if (patch.category !== undefined) {
    updates.category =
      patch.category === null || patch.category === ""
        ? null
        : patch.category.trim();
  }

  if (patch.status !== undefined) {
    updates.status = patch.status;
    const ca = completedAtForStatus(patch.status, row.status);
    if (ca !== undefined) updates.completed_at = ca;
  }

  if (Object.keys(updates).length === 0) {
    return rowToTodo(row);
  }

  const { data, error } = await supabase
    .from("todos")
    .update(updates)
    .eq("id", id)
    .eq("user_id", uid)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return rowToTodo(data as TodoRow);
}

export async function archiveTodo(
  id: string,
  userId: string,
  client?: SupabaseClient,
): Promise<Todo | null> {
  const uid = assertUserId(userId);
  const supabase = db(client);
  const { data, error } = await supabase
    .from("todos")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", uid)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return rowToTodo(data as TodoRow);
}

/** Checkbox rule: completed -> open; otherwise -> completed (from open or in_progress). */
export async function toggleTodoCompletedUi(
  id: string,
  userId: string,
  client?: SupabaseClient,
): Promise<Todo | null> {
  const uid = assertUserId(userId);
  const supabase = db(client);
  const { data: existing, error: fetchErr } = await supabase
    .from("todos")
    .select("*")
    .eq("id", id)
    .eq("user_id", uid)
    .is("archived_at", null)
    .maybeSingle();
  if (fetchErr) throw new Error(fetchErr.message);
  if (!existing) return null;

  const row = existing as TodoRow;
  const next: TodoStatus = row.status === "completed" ? "open" : "completed";
  return updateTodo(id, { status: next }, uid, client);
}

/** Progress control: open ↔ in_progress only (no-op if completed). */
export async function toggleTodoInProgressUi(
  id: string,
  userId: string,
  client?: SupabaseClient,
): Promise<Todo | null> {
  const uid = assertUserId(userId);
  const supabase = db(client);
  const { data: existing, error: fetchErr } = await supabase
    .from("todos")
    .select("*")
    .eq("id", id)
    .eq("user_id", uid)
    .is("archived_at", null)
    .maybeSingle();
  if (fetchErr) throw new Error(fetchErr.message);
  if (!existing) return null;

  const row = existing as TodoRow;
  if (row.status === "completed") return rowToTodo(row);

  const next: TodoStatus =
    row.status === "in_progress" ? "open" : "in_progress";
  return updateTodo(id, { status: next }, uid, client);
}

export async function restoreTodo(
  id: string,
  userId: string,
  client?: SupabaseClient,
): Promise<Todo | null> {
  return updateTodo(id, { restore: true }, userId, client);
}
