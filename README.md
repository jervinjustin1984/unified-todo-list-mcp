# Unified todo list (REST + MCP)

Personal todo tracker with a **Next.js** app on **Vercel**, **Supabase Postgres**, **REST** routes, a **remote MCP** endpoint (Streamable HTTP), and a small **web UI** for testing. The web UI uses **server actions** so your `API_KEY` is never sent to the browser; only `curl`/scripts need the bearer token.

## What you do next (checklist)

1. **Create a Supabase project** at [supabase.com](https://supabase.com) if you have not already.
2. **Run the migration** in the Supabase SQL editor (or via Supabase CLI): open [`supabase/migrations/20250515120000_create_todos.sql`](supabase/migrations/20250515120000_create_todos.sql) and execute it against your database.
3. **Create `.env.local`** from [`.env.example`](.env.example): set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `API_KEY` (a long random string).
4. **Run locally**: `npm install` then `npm run dev` and open [http://localhost:3000](http://localhost:3000).
5. **Push to GitHub** and **import the repo in Vercel**; add the same environment variables in the Vercel project settings.

## REST API

All routes require:

```http
Authorization: Bearer <API_KEY>
```

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/todos` | List todos. Query: `q`, `status`, `priority`, `category`, `includeArchived`, `archivedOnly` |
| `POST` | `/api/todos` | Create todo (`name`, optional `status`, `priority`, `category`) |
| `PATCH` | `/api/todos/:id` | Partial update; set `{ "restore": true }` to un-archive |
| `DELETE` | `/api/todos/:id` | Archive (soft delete) |

Example:

```bash
curl -sS -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Buy milk"}' \
  https://YOUR_DOMAIN/api/todos
```

Responses use camelCase fields: `id`, `userId`, `name`, `createdAt`, `status`, `priority`, `category`, `completedAt`, `archivedAt`.

## MCP (remote)

- **URL**: `https://YOUR_DOMAIN/api/mcp` (the `[transport]` segment is the literal path `mcp`).
- **Auth**: `Authorization: Bearer <API_KEY>` (enforced by the server).

Tools: `list_todos`, `search_todos`, `add_todo`, `update_todo`, `archive_todo`, `delete_todo` (alias), `restore_todo`.

**Cursor** (Streamable HTTP): add an MCP config entry pointing at that URL and configure the client to send the bearer token per [mcp-handler client docs](https://github.com/vercel/mcp-handler/blob/main/docs/CLIENTS.md). If your client only supports stdio, use `npx mcp-remote https://YOUR_DOMAIN/api/mcp` as in the mcp-handler README.

## Project layout

- [`src/lib/todos-service.ts`](src/lib/todos-service.ts) — DB access shared by REST, MCP, and server actions
- [`src/app/api/todos/`](src/app/api/todos/) — REST handlers
- [`src/app/api/[transport]/route.ts`](src/app/api/[transport]/route.ts) — MCP handler (`/api/mcp`)
- [`src/app/actions.ts`](src/app/actions.ts) — Server actions for the web UI

## Default user

Single-user v1: todos use `user_id` default **`jervinjustin`** in the database (see [`src/lib/constants.ts`](src/lib/constants.ts)).
