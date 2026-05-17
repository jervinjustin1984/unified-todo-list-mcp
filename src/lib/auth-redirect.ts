import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  authorizeQueryFromPending,
  MCP_OAUTH_PENDING_COOKIE,
  parsePendingParams,
} from "@/lib/mcp-oauth/pending";

/** After sign-in or sign-up, resume MCP OAuth if a pending authorize cookie exists. */
export async function redirectAfterAuth(): Promise<never> {
  const pending = (await cookies()).get(MCP_OAUTH_PENDING_COOKIE)?.value;
  if (pending) {
    const params = parsePendingParams(pending);
    if (params) {
      redirect(`/oauth/authorize?${authorizeQueryFromPending(params)}`);
    }
  }
  redirect("/");
}
