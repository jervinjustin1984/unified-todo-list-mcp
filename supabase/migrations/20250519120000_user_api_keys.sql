-- Personal API keys (Bearer utl_...) for REST/MCP; v1 stores secret in plaintext for Settings list

create table if not exists public.user_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'API key',
  secret text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists user_api_keys_user_id_idx
  on public.user_api_keys (user_id);

create index if not exists user_api_keys_active_secret_idx
  on public.user_api_keys (secret)
  where revoked_at is null;

alter table public.user_api_keys enable row level security;

-- No policies: service role only (server-side)
