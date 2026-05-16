"use server";

import { revalidatePath } from "next/cache";
import {
  archiveTodo,
  createTodo,
  restoreTodo,
  toggleTodoCompletedUi,
} from "@/lib/todos-service";

export async function addTodoAction(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const trimmed = name.trim();
  if (!trimmed) {
    return;
  }
  try {
    await createTodo({ name: trimmed });
    revalidatePath("/");
  } catch {
    // v1: errors surface on next navigation; add toast later
  }
}

export async function toggleTodoAction(id: string) {
  try {
    const todo = await toggleTodoCompletedUi(id);
    if (!todo) {
      return { ok: false as const, error: "Todo not found or archived" };
    }
    revalidatePath("/");
    return { ok: true as const };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update";
    return { ok: false as const, error: message };
  }
}

export async function archiveTodoAction(id: string) {
  try {
    const todo = await archiveTodo(id);
    if (!todo) {
      return { ok: false as const, error: "Todo not found" };
    }
    revalidatePath("/");
    return { ok: true as const };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to archive";
    return { ok: false as const, error: message };
  }
}

export async function restoreTodoAction(id: string) {
  try {
    const todo = await restoreTodo(id);
    if (!todo) {
      return { ok: false as const, error: "Todo not found" };
    }
    revalidatePath("/");
    return { ok: true as const };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to restore";
    return { ok: false as const, error: message };
  }
}
