import { getPublicOrigin } from "mcp-handler";

/** OAuth issuer / app origin (respects Vercel proxy headers). */
export function getAppOrigin(req: Request): string {
  const override = process.env.MCP_OAUTH_ISSUER?.replace(/\/$/, "");
  if (override) return override;
  return getPublicOrigin(req);
}

export function mcpResourceUrl(origin: string): string {
  return `${origin}/api/mcp`;
}
