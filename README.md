# Unified todo list (REST + MCP)

Personal todo tracker with **Next.js** on **Vercel**, **Supabase Postgres + Auth**, **REST** routes, a **remote MCP** endpoint (Streamable HTTP), and a small **web UI**.

Auth uses **Supabase JWT access tokens** (not a shared API key). REST and MCP require `Authorization: Bearer <access_token>`.

## Setup checklist

1. **Supabase project** at [supabase.com](https://supabase.com).
2. **Run migrations** in order in the SQL editor:
   - [`supabase/migrations/20250515120000_create_todos.sql`](supabase/migrations/20250515120000_create_todos.sql)
   - [`supabase/migrations/20250516120000_multi_user_auth.sql`](supabase/migrations/20250516120000_multi_user_auth.sql)
3. **Create your user** in Supabase Dashboard → Authentication → Users (email + password). Disable public signup if you want invite-only.
4. **Backfill `user_id`** if you had todos under the old text `user_id` (e.g. `jervinjustin`):

   ```sql
   UPDATE public.todos
   SET user_id = '<your-auth-user-uuid>'::uuid
   WHERE user_id IS NULL;
   ```

   Then optionally: `ALTER TABLE public.todos ALTER COLUMN user_id SET NOT NULL;`

5. **Environment** — copy [`.env.example`](.env.example) to `.env.local` and set all variables. `NEXT_PUBLIC_SUPABASE_URL` should match `SUPABASE_URL`. **`SUPABASE_SERVICE_ROLE_KEY` must be the `service_role` secret**, not the `anon` key (the web UI uses your login session; REST/MCP use the service role with a JWT).
6. **Local dev**: `npm install` → `npm run dev` → [http://localhost:3000](http://localhost:3000) (sign in at `/login`).
7. **Vercel**: import repo, set the same env vars, redeploy.

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
| `POST` | `/api/todos` | Create todo |
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
- **Auth**: `Authorization: Bearer <supabase_access_token>`
- **Metadata**: `https://YOUR_DOMAIN/.well-known/oauth-protected-resource` (points clients at Supabase Auth)

Tools: `list_todos`, `search_todos`, `add_todo`, `update_todo`, `archive_todo`, `delete_todo`, `restore_todo`.

**Cursor**: configure remote MCP with the URL above and a Bearer token from the sign-in step (or OAuth if your Cursor version supports Supabase as the authorization server). If native OAuth fails, use [mcp-remote](https://www.npmjs.com/package/mcp-remote) as a stdio bridge.

## Project layout

- [`src/lib/auth.ts`](src/lib/auth.ts) — JWT verification (JWKS)
- [`src/lib/todos-service.ts`](src/lib/todos-service.ts) — DB access (service role + `userId` filter)
- [`src/app/api/todos/`](src/app/api/todos/) — REST
- [`src/app/api/[transport]/route.ts`](src/app/api/[transport]/route.ts) — MCP (`/api/mcp`)
- [`src/lib/supabase/`](src/lib/supabase/) — SSR session clients

## Adding more users later

Create users in Supabase Dashboard (or enable signup). Each user only sees their own todos (RLS + app-layer `user_id` filter).
