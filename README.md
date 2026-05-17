# Unified todo list (REST + MCP)

Personal todo tracker with **Next.js** on **Vercel**, **Supabase Postgres + Auth**, **REST** routes, a **remote MCP** endpoint (Streamable HTTP), and a small **web UI**.

Auth uses **Supabase JWT access tokens** (not a shared API key). REST and MCP require `Authorization: Bearer <access_token>`.

## Setup checklist

1. **Supabase project** at [supabase.com](https://supabase.com).
2. **Run migrations** in order in the SQL editor:
   - [`supabase/migrations/20250515120000_create_todos.sql`](supabase/migrations/20250515120000_create_todos.sql)
   - [`supabase/migrations/20250516120000_multi_user_auth.sql`](supabase/migrations/20250516120000_multi_user_auth.sql)
   - [`supabase/migrations/20250517120000_mcp_oauth.sql`](supabase/migrations/20250517120000_mcp_oauth.sql)
   - [`supabase/migrations/20250518120000_todo_source.sql`](supabase/migrations/20250518120000_todo_source.sql)
   - [`supabase/migrations/20250518120001_todo_source_open.sql`](supabase/migrations/20250518120001_todo_source_open.sql) (only if you ran an earlier version of `20250518120000` with the enum check)
3. **Create your user** in Supabase Dashboard → Authentication → Users (email + password). Disable public signup if you want invite-only.
4. **Backfill `user_id`** if you had todos under the old text `user_id` (e.g. `jervinjustin`):

   ```sql
   UPDATE public.todos
   SET user_id = '<your-auth-user-uuid>'::uuid
   WHERE user_id IS NULL;
   ```

   Then optionally: `ALTER TABLE public.todos ALTER COLUMN user_id SET NOT NULL;`

5. **Environment** — copy [`.env.example`](.env.example) to `.env.local`. In Supabase **Settings → API Keys**:
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = **anon** (legacy `eyJ…`) or **publishable** (`sb_publishable_…`) — used for **login**
   - `SUPABASE_SERVICE_ROLE_KEY` = **service_role** (legacy `eyJ…`) or **secret** (`sb_secret_…`) — **server only**, never in `NEXT_PUBLIC_*`
   - Wrong keys cause **"Invalid API Key"** on login (e.g. Stripe `sk_live_…`, or putting `sb_publishable_` in `SUPABASE_SERVICE_ROLE_KEY`)
6. **Local dev**: `npm install` → `npm run dev` → [http://localhost:3000](http://localhost:3000) (sign in at `/login`).
7. **Vercel** — required env vars (then **Redeploy** so `NEXT_PUBLIC_*` are baked into the build):

   | Variable | Notes |
   |----------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Same as `SUPABASE_URL` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **anon** key (not service_role) |
   | `SUPABASE_URL` | Same URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | **service_role** secret |
   | `SUPABASE_ANON_KEY` | Optional; middleware fallback if `NEXT_PUBLIC_*` missing |
   | `MCP_OAUTH_CODE_SECRET` | Optional; encrypts OAuth codes at rest (defaults to service role key) |
   | `MCP_OAUTH_ISSUER` | Optional; override OAuth issuer URL (defaults to request origin) |

   If you see `MIDDLEWARE_INVOCATION_FAILED`, the middleware is usually missing `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_URL` at **build** time — add them in Vercel → Settings → Environment Variables → **Redeploy**.

## Web UI

- Sign in at `/login` with your Supabase Auth user.
- Todos are scoped to your `auth.users.id` via server session (no token in the browser for API calls).

## REST API

```http
Authorization: Bearer <supabase_access_token>
```

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/todos` | List todos (`q`, `status`, `priority`, `category`, `includeArchived`, `archivedOnly`) |
| `POST` | `/api/todos` | Create todo; optional `source` string (max 200 chars, default `Website via API`) |
| `PATCH` | `/api/todos/:id` | Update; `{ "restore": true }` to un-archive |
| `DELETE` | `/api/todos/:id` | Archive (soft delete) |

### Get an access token for curl / scripts

Sign in via the Supabase API (replace project URL and anon key):

```bash
curl -sS "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"your-password"}' \
  | jq -r .access_token
```

Use that value as `Bearer` for REST and MCP.

## MCP (remote)

- **URL**: `https://YOUR_DOMAIN/api/mcp`
- **OAuth** (recommended for Claude Desktop): add the MCP URL only; the client discovers OAuth via `/.well-known/oauth-protected-resource` and signs you in on the app domain (`/login`). Tokens are Supabase JWTs with refresh via `/oauth/token`.
- **Metadata**: `https://YOUR_DOMAIN/.well-known/oauth-protected-resource`, `https://YOUR_DOMAIN/.well-known/oauth-authorization-server`

Tools: `list_todos`, `search_todos`, `add_todo`, `update_todo`, `archive_todo`, `delete_todo`, `restore_todo`.

### Claude Desktop (URL-only)

In Claude → Settings → Connectors, add remote MCP:

```text
https://unified-todo-list-mcp.vercel.app/api/mcp
```

Complete the browser login when prompted. No manual Bearer token or `mcp-remote` required.

### Fallback: manual Bearer (curl / scripts)

Use a Supabase access token as `Authorization: Bearer <token>` (see REST section above). For Claude, you can still use [mcp-remote](https://www.npmjs.com/package/mcp-remote) with a pasted JWT if OAuth is unavailable.

## Project layout

- [`src/lib/auth.ts`](src/lib/auth.ts) — JWT verification (JWKS)
- [`src/lib/todos-service.ts`](src/lib/todos-service.ts) — DB access (service role + `userId` filter)
- [`src/app/api/todos/`](src/app/api/todos/) — REST
- [`src/app/api/[transport]/route.ts`](src/app/api/[transport]/route.ts) — MCP (`/api/mcp`)
- [`src/lib/supabase/`](src/lib/supabase/) — SSR session clients
- [`src/lib/mcp-oauth/`](src/lib/mcp-oauth/) — MCP OAuth authorization server
- [`src/app/oauth/`](src/app/oauth/) — `/oauth/register`, `/oauth/authorize`, `/oauth/token`

## Adding more users later

Create users in Supabase Dashboard (or enable signup). Each user only sees their own todos (RLS + app-layer `user_id` filter).
