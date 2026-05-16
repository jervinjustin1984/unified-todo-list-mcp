"use server";

import { cookies } from "next/headers";
import {
  authorizeQueryFromPending,
  MCP_OAUTH_PENDING_COOKIE,
  parsePendingParams,
} from "@/lib/mcp-oauth/pending";

export async function resumeMcpOAuthAfterLogin(): Promise<{
  redirect: string;
}> {
  const cookieStore = await cookies();
  const pending = cookieStore.get(MCP_OAUTH_PENDING_COOKIE)?.value;

  if (!pending) {
    return { redirect: "/" };
  }

  const params = parsePendingParams(pending);
  if (!params) {
    return { redirect: "/" };
  }

  return {
    redirect: `/oauth/authorize?${authorizeQueryFromPending(params)}`,
  };
}
