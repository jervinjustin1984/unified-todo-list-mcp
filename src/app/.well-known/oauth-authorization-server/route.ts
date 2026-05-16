import { metadataCorsOptionsRequestHandler } from "mcp-handler";
import {
  authorizationServerMetadata,
  jsonMetadataResponse,
} from "@/lib/mcp-oauth/metadata";
import { getAppOrigin } from "@/lib/mcp-oauth/origin";

export async function GET(req: Request) {
  const origin = getAppOrigin(req);
  return jsonMetadataResponse(authorizationServerMetadata(origin));
}

const corsHandler = metadataCorsOptionsRequestHandler();

export const OPTIONS = corsHandler;
