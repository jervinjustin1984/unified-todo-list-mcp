# Unified todo list (REST + MCP)

Personal todo tracker with **Next.js** on **Vercel**, **Supabase Postgres + Auth**, **REST** routes, a **remote MCP** endpoint (Streamable HTTP), and a small **web UI**.

Auth for REST and MCP: **`Authorization: Bearer`** with either a **Supabase JWT** (short-lived) or a personal **`utl_…` API key** (long-lived; create under **API keys** in the web UI).

## Setup checklist

1. **Supabase project** at [supabase.com](https://supabase.com).
2. **Run migrations** in order in the SQL editor:
   - [`supabase/migrations/20250515120000_create_todos.sql`](supabase/migrations/20250515120000_create_todos.sql)
   - [`supabase/migrations/20250516120000_multi_user_auth.sql`](supabase/migrations/20250516120000_multi_user_auth.sql)
   - [`supabase/migrations/20250517120000_mcp_oauth.sql`](supabase/migrations/20250517120000_mcp_oauth.sql)
   - [`supabase/migrations/20250518120000_todo_source.sql`](supabase/migrations/20250518120000_todo_source.sql)
   - [`supabase/migrations/20250518120001_todo_source_open.sql`](supabase/migrations/20250518120001_todo_source_open.sql) (only if you ran an earlier version of `20250518120000` with the enum check)
   - [`supabase/migrations/20250519120000_user_api_keys.sql`](supabase/migrations/20250519120000_user_api_keys.sql)
3. **Auth (Supabase Dashboard → Authentication)**:
   - **Providers → Email**: enable sign ups; turn **Confirm email** off if you want immediate access after `/signup`.
   - **URL configuration**: set **Site URL** and add redirect URLs for `/auth/confirm` and `/auth/callback` (e.g. `http://localhost:3000/auth/confirm`, production equivalent).
   - **Reset password email template** (Authentication → Email Templates → Reset password): use a link to `/auth/confirm` with `token_hash` (required for server-side auth):

     ```html
     <h2>Reset password</h2>
     <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">Reset password</a></p>
     ```

     Request a **new** reset email after changing the template.

   - **Emails not arriving?** Check the server terminal for `[forgot-password]` errors. Supabase’s built-in mailer has a **low hourly rate limit** (`email rate limit exceeded`); wait ~1 hour or configure [custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp) under Authentication → SMTP. View send attempts in Supabase **Authentication → Logs**.
   - Users can register at `/signup` and reset passwords at `/forgot-password`. Admins can still create users in the Dashboard.
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

- **Sign up** at `/signup` or **sign in** at `/login`.
- **Forgot password** at `/forgot-password` (email reset link → set new password).
- Todos are scoped to your `auth.users.id` via server session (no token in the browser for API calls).
- **API keys** at [`/settings/api-keys`](http://localhost:3000/settings/api-keys) — per-user `utl_…` tokens for Shortcuts, curl, and MCP (full secret listed in Settings v1).

## REST API

```http
Authorization: Bearer <supabase_access_token | utl_...>
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

### Personal API keys (`utl_…`)

1. Sign in → **API keys** → create a key (e.g. `Siri`).
2. Use `Authorization: Bearer utl_…` on REST and MCP (same as JWT).
3. Revoke lost keys from the same page.

### Siri / Apple Shortcuts

See [docs/siri-shortcuts.md](docs/siri-shortcuts.md). Summary: Shortcut **POST**s to `/api/todos` with your `utl_…` key and `"source": "Siri via Shortcuts"`.

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

## Users

Open registration at `/signup`. Each user only sees their own todos (RLS + app-layer `user_id` filter). Admins can still add users in Supabase Dashboard.
