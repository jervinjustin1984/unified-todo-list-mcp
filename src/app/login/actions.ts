"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  authorizeQueryFromPending,
  MCP_OAUTH_PENDING_COOKIE,
  parsePendingParams,
} from "@/lib/mcp-oauth/pending";

export type SignInState = { error?: string } | null;

export async function signInAction(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  const pending = (await cookies()).get(MCP_OAUTH_PENDING_COOKIE)?.value;
  if (pending) {
    const params = parsePendingParams(pending);
    if (params) {
      redirect(`/oauth/authorize?${authorizeQueryFromPending(params)}`);
    }
  }

  redirect("/");
}
