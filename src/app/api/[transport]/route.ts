import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { userIdFromMcpExtra, verifyMcpBearerToken } from "@/lib/auth";
import {
  archiveTodo,
  createTodo,
  listTodos,
  restoreTodo,
  updateTodo,
} from "@/lib/todos-service";

const statusZ = z.enum(["open", "in_progress", "completed"]);
const priorityZ = z.enum(["low", "medium", "high"]);

function jsonText(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

function requireMcpUserId(extra: { authInfo?: import("@modelcontextprotocol/sdk/server/auth/types.js").AuthInfo }) {
  const userId = userIdFromMcpExtra(extra);
  if (!userId) {
    return { error: "Unauthorized: missing auth context" } as const;
  }
  return { userId } as const;
}

const mcpCore = createMcpHandler(
  (server) => {
    server.registerTool(
      "list_todos",
      {
        title: "List todos",
        description:
          "List todos for the authenticated user. By default excludes archived items.",
        inputSchema: {
          q: z.string().optional().describe("Search substring for name"),
          status: statusZ.optional(),
          priority: priorityZ.optional(),
          category: z.string().optional(),
          include_archived: z.boolean().optional(),
          archived_only: z.boolean().optional(),
        },
      },
      async (args, extra) => {
        const auth = requireMcpUserId(extra);
        if ("error" in auth) return jsonText(auth);
        const todos = await listTodos({
          userId: auth.userId,
          q: args.q,
          status: args.status,
          priority: args.priority,
          category: args.category,
          includeArchived: args.include_archived,
          archivedOnly: args.archived_only,
        });
        return jsonText({ todos });
      },
    );

    server.registerTool(
      "search_todos",
      {
        title: "Search todos",
        description: "Search todos by name substring (same filters as list).",
        inputSchema: {
          q: z.string().min(1),
          status: statusZ.optional(),
          priority: priorityZ.optional(),
          category: z.string().optional(),
          include_archived: z.boolean().optional(),
        },
      },
      async (args, extra) => {
        const auth = requireMcpUserId(extra);
        if ("error" in auth) return jsonText(auth);
        const todos = await listTodos({
          userId: auth.userId,
          q: args.q,
          status: args.status,
          priority: args.priority,
          category: args.category,
          includeArchived: args.include_archived,
        });
        return jsonText({ todos });
      },
    );

    server.registerTool(
      "add_todo",
      {
        title: "Add todo",
        description: "Create a new todo for the authenticated user.",
        inputSchema: {
          name: z.string().min(1).max(2000),
          status: statusZ.optional(),
          priority: priorityZ.optional(),
          category: z.string().max(200).nullable().optional(),
        },
      },
      async (args, extra) => {
        const auth = requireMcpUserId(extra);
        if ("error" in auth) return jsonText(auth);
        const todo = await createTodo({
          userId: auth.userId,
          name: args.name,
          status: args.status,
          priority: args.priority,
          category: args.category,
        });
        return jsonText({ todo });
      },
    );

    server.registerTool(
      "update_todo",
      {
        title: "Update todo",
        description:
          "Update fields on a todo (status, priority, category, name, restore).",
        inputSchema: {
          id: z.string().uuid(),
          name: z.string().min(1).max(2000).optional(),
          status: statusZ.optional(),
          priority: priorityZ.optional(),
          category: z.string().max(200).nullable().optional(),
          restore: z.boolean().optional(),
        },
      },
      async (args, extra) => {
        const auth = requireMcpUserId(extra);
        if ("error" in auth) return jsonText(auth);
        const { id, ...patch } = args;
        const todo = await updateTodo(id, patch, auth.userId);
        if (!todo) {
          return jsonText({ error: "Todo not found", id: args.id });
        }
        return jsonText({ todo });
      },
    );

    server.registerTool(
      "archive_todo",
      {
        title: "Archive todo",
        description: "Soft-delete a todo (sets archived_at).",
        inputSchema: { id: z.string().uuid() },
      },
      async ({ id }, extra) => {
        const auth = requireMcpUserId(extra);
        if ("error" in auth) return jsonText(auth);
        const todo = await archiveTodo(id, auth.userId);
        if (!todo) {
          return jsonText({ error: "Todo not found", id });
        }
        return jsonText({ todo });
      },
    );

    server.registerTool(
      "delete_todo",
      {
        title: "Delete todo (archive)",
        description: "Alias for archive_todo — does not permanently delete.",
        inputSchema: { id: z.string().uuid() },
      },
      async ({ id }, extra) => {
        const auth = requireMcpUserId(extra);
        if ("error" in auth) return jsonText(auth);
        const todo = await archiveTodo(id, auth.userId);
        if (!todo) {
          return jsonText({ error: "Todo not found", id });
        }
        return jsonText({ todo });
      },
    );

    server.registerTool(
      "restore_todo",
      {
        title: "Restore todo",
        description: "Clear archived_at so the todo is active again.",
        inputSchema: { id: z.string().uuid() },
      },
      async ({ id }, extra) => {
        const auth = requireMcpUserId(extra);
        if ("error" in auth) return jsonText(auth);
        const todo = await restoreTodo(id, auth.userId);
        if (!todo) {
          return jsonText({ error: "Todo not found", id });
        }
        return jsonText({ todo });
      },
    );
  },
  {
    serverInfo: {
      name: "unified-todo-list",
      version: "0.2.0",
    },
  },
  {
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV === "development",
  },
);

const mcp = withMcpAuth(mcpCore, verifyMcpBearerToken, { required: true });

export const GET = mcp;
export const POST = mcp;

export const maxDuration = 60;
