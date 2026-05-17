"use server";

import { revalidatePath } from "next/cache";
import {
  createApiKeyForUser,
  revokeApiKeyForUser,
} from "@/lib/api-keys";
import { requireSessionUserId } from "@/lib/session";

export type ApiKeyActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function createApiKeyAction(
  _prev: ApiKeyActionResult | null,
  formData: FormData,
): Promise<ApiKeyActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { ok: false, error: "Name is required" };
  }

  try {
    const userId = await requireSessionUserId();
    await createApiKeyForUser(userId, name);
    revalidatePath("/settings/api-keys");
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create API key";
    return { ok: false, error: message };
  }
}

export async function revokeApiKeyAction(
  keyId: string,
): Promise<ApiKeyActionResult> {
  if (!keyId) {
    return { ok: false, error: "Missing key id" };
  }

  try {
    const userId = await requireSessionUserId();
    const revoked = await revokeApiKeyForUser(keyId, userId);
    if (!revoked) {
      return { ok: false, error: "API key not found" };
    }
    revalidatePath("/settings/api-keys");
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to revoke API key";
    return { ok: false, error: message };
  }
}
