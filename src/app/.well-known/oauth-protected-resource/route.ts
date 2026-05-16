import {
  generateProtectedResourceMetadata,
  getPublicOrigin,
  metadataCorsOptionsRequestHandler,
} from "mcp-handler";
import { mcpResourceUrl } from "@/lib/mcp-oauth/origin";

export async function GET(req: Request) {
  const origin = getPublicOrigin(req);
  const metadata = generateProtectedResourceMetadata({
    authServerUrls: [origin],
    resourceUrl: mcpResourceUrl(origin),
  });
  return new Response(JSON.stringify(metadata), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

const corsHandler = metadataCorsOptionsRequestHandler();

export const OPTIONS = corsHandler;
