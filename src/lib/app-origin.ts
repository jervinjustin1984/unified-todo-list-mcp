import { headers } from "next/headers";

/** App origin for links shown in the UI (Vercel/proxy-aware). */
export async function getSiteOrigin(): Promise<string> {
  const override = process.env.MCP_OAUTH_ISSUER?.replace(/\/$/, "");
  if (override) return override;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "http://localhost:3000";

  const proto =
    h.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");

  return `${proto}://${host}`;
}
