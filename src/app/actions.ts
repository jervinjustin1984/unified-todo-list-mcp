"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  archiveTodoForSession,
  createTodoForSession,
  restoreTodoForSession,
  toggleTodoForSession,
} from "@/lib/todos-service-web";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function addTodoAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "");
  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: "Name is required" };
  }
  try {
    await createTodoForSession({ name: trimmed });
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to add todo";
    return { ok: false, error: message };
  }
}

export async function toggleTodoAction(id: string) {
  try {
    const todo = await toggleTodoForSession(id);
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
    const todo = await archiveTodoForSession(id);
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
    const todo = await restoreTodoForSession(id);
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

export async function signOutAction() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
