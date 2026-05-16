# Agent handoff: unified-todo-list-mcp

Compressed context for continuing work or onboarding another agent.

## Project

Personal todo app: **Next.js 16** on **Vercel**, **Supabase Postgres + Auth**, **REST** (`/api/todos`), **remote MCP** (`/api/mcp`), minimal web UI at `/`.

Repo was greenfield; now fully implemented. Original single-user `jervinjustin` text id → multi-user via `user_id` = Supabase `auth.users.id` (UUID).

## Stack

- **DB**: Supabase Postgres; migrations in `supabase/migrations/`
- **Web**: Server actions + `@supabase/ssr` session; RLS-aware client in `src/lib/todos-service-web.ts`
- **REST/MCP**: Service role + explicit `userId` from verified credential in `src/lib/todos-service.ts`
- **MCP**: `mcp-handler` + `@modelcontextprotocol/sdk`, Streamable HTTP at `/api/mcp`
- **Auth (current)**: Supabase JWT in `Authorization: Bearer`; validated via JWKS in `src/lib/auth.ts`

## Key files

| Path | Role |
|------|------|
| `src/lib/auth.ts` | JWT verify (`verifySupabaseAccessToken`), `requireAuth`, `verifyMcpBearerToken` |
| `src/lib/todos-service.ts` | DB ops; optional `SupabaseClient` arg |
| `src/lib/todos-service-web.ts` | Web UI uses session client |
| `src/app/api/[transport]/route.ts` | MCP tools; `withMcpAuth(..., { required: true })` |
| `src/app/.well-known/oauth-protected-resource/route.ts` | MCP resource metadata; AS = **app origin** |
| `src/app/.well-known/oauth-authorization-server/route.ts` | OAuth AS metadata (RFC 8414) |
| `src/app/oauth/*` | DCR, authorize, token, revoke |
| `src/lib/mcp-oauth/` | PKCE, codes, clients, Supabase token handoff |
| `src/middleware.ts` | Session refresh; protects `/` → `/login` |
| `src/lib/supabase/validate-keys.ts` | Blocks wrong key types (Stripe, publishable in service_role slot, etc.) |

## Env vars (Vercel + `.env.local`)

- `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` (same URL)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — login / browser / middleware
- `SUPABASE_SERVICE_ROLE_KEY` — server only (REST/MCP); **not** publishable/anon
- Optional: `SUPABASE_ANON_KEY` — middleware fallback
- **Removed**: `API_KEY` (replaced by Supabase JWT auth)

Common mistakes: anon key in `SUPABASE_SERVICE_ROLE_KEY`; Stripe `sk_live_` in Supabase slots; duplicate `.env` lines.

## Migrations

1. `20250515120000_create_todos.sql` — initial `todos` table
2. `20250516120000_multi_user_auth.sql` — `user_id` UUID + RLS
3. `20250517120000_mcp_oauth.sql` — `mcp_oauth_clients`, `mcp_oauth_codes`

Backfill if needed:

```sql
UPDATE public.todos SET user_id = '<auth-user-uuid>'::uuid WHERE user_id IS NULL;
```

## MCP tools

`list_todos`, `search_todos`, `add_todo`, `update_todo`, `archive_todo`, `delete_todo`, `restore_todo` — scoped to authenticated user (`sub` / session).

## Issues already fixed

1. **Vercel `MIDDLEWARE_INVOCATION_FAILED`**: missing `NEXT_PUBLIC_*` at build; middleware `setAll` + cache headers + safe env + try/catch.
2. **Login "Invalid API Key"**: wrong keys in `.env` (e.g. Stripe key, publishable as service_role).
3. **Web UI empty / no inserts**: web path must use session Supabase client (RLS); service-role-only path saw no rows / blocked inserts. `addTodoAction` now surfaces errors.
4. **Git push blocked (secret scanning)**: real keys in branch history (e.g. commit `c970d81` in `.env.example`). Fix: `git reset --soft main`, one clean commit, rotate Supabase keys.

## Claude Desktop (current working path)

Manual Supabase JWT (~1 hour TTL). Config uses `mcp-remote` + Bearer header:

```json
{
  "mcpServers": {
    "unified-todos": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@latest",
        "https://unified-todo-list-mcp.vercel.app/api/mcp",
        "--header",
        "Authorization:${TODO_AUTH_HEADER}"
      ],
      "env": {
        "TODO_AUTH_HEADER": "Bearer <access_token>"
      }
    }
  }
}
```

Get token:

```bash
curl -sS "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"...","password":"..."}' | jq -r .access_token
```

Config file (macOS): `~/Library/Application Support/Claude/claude_desktop_config.json`

- Valid JSON: comma after `preferences` object before `mcpServers`
- Use `Authorization:${TODO_AUTH_HEADER}` with **no space before `:`**; value must include `Bearer ` prefix

## MCP OAuth (implemented)

**Marianatek/Cousteau-style** remote MCP: Claude adds URL → browser login on app domain → Supabase JWT + refresh via `/oauth/token`.

- `/.well-known/oauth-protected-resource` → `authorization_servers: [app origin]`
- `/.well-known/oauth-authorization-server` → `/oauth/authorize`, `/oauth/token`, `/oauth/register` (PKCE S256)
- Sign-in uses existing `/login` + Supabase session; codes stored in `mcp_oauth_*` tables

**Claude Desktop**: URL only — `https://unified-todo-list-mcp.vercel.app/api/mcp` (no `mcp-remote` Bearer env).

**Fallback**: manual JWT + `mcp-remote` (see below).

## Deploy

- Production: `https://unified-todo-list-mcp.vercel.app`
- Local: `npm run dev` → `/login`
- `npm run build` and `npm run lint` pass

## Product decisions (locked)

| Topic | Choice |
|-------|--------|
| Audience | Multi-user (manual users in Supabase dashboard for now) |
| REST + MCP auth | Same Bearer credential model |
| Token type | Supabase JWT (JWKS validation) |
| IdP | Supabase Auth |
| Web checkbox | Open ↔ completed only; `in_progress` via API/MCP |
| Archive | Soft delete + restore in v1 |

## Related plan file

`.cursor/plans/oauth_vs_api_key_8859926f.plan.md` (may live under user’s `.cursor/plans/`)
