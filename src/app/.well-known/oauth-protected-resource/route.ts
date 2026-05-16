import {
  metadataCorsOptionsRequestHandler,
  protectedResourceHandler,
} from "mcp-handler";
import { getSupabaseIssuer, getSupabaseUrl } from "@/lib/supabase/env";

const handler = protectedResourceHandler({
  authServerUrls: [getSupabaseIssuer()],
  resourceUrl: `${getSupabaseUrl()}/api/mcp`,
});

const corsHandler = metadataCorsOptionsRequestHandler();

export const GET = handler;
export const OPTIONS = corsHandler;
