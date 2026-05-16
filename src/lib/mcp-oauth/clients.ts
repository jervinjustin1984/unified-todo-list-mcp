import { getSupabaseAdmin } from "@/lib/db";
import { randomToken } from "@/lib/mcp-oauth/crypto";

export type OAuthClient = {
  client_id: string;
  client_name: string | null;
  redirect_uris: string[];
};

export async function registerClient(input: {
  redirect_uris: string[];
  client_name?: string;
}): Promise<OAuthClient> {
  if (!input.redirect_uris?.length) {
    throw new Error("redirect_uris is required");
  }

  const client_id = randomToken(16);
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("mcp_oauth_clients").insert({
    client_id,
    client_name: input.client_name ?? null,
    redirect_uris: input.redirect_uris,
  });

  if (error) throw new Error(error.message);

  return {
    client_id,
    client_name: input.client_name ?? null,
    redirect_uris: input.redirect_uris,
  };
}

export async function getClient(clientId: string): Promise<OAuthClient | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("mcp_oauth_clients")
    .select("client_id, client_name, redirect_uris")
    .eq("client_id", clientId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    client_id: data.client_id,
    client_name: data.client_name,
    redirect_uris: data.redirect_uris ?? [],
  };
}

export function isRedirectUriAllowed(
  client: OAuthClient,
  redirectUri: string,
): boolean {
  return client.redirect_uris.includes(redirectUri);
}
