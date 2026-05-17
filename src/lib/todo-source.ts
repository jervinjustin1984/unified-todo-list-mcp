/** Free-form label for where a todo was created (e.g. "Siri via API"). */
export type TodoSource = string;

export const SOURCE_MAX_LENGTH = 200;

/** Default when REST POST omits `source`. */
export const DEFAULT_REST_SOURCE = "Website via API";

export const MCP_SOURCE = "Claude via MCP";
export const WEB_SOURCE = "Web UI";
