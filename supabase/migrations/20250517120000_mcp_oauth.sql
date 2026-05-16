-- MCP OAuth (authorization server on app origin; Supabase Auth for sign-in)

create table if not exists public.mcp_oauth_clients (
  client_id text primary key,
  client_name text,
  redirect_uris text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.mcp_oauth_codes (
  code text primary key,
  client_id text not null references public.mcp_oauth_clients (client_id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  redirect_uri text not null,
  code_challenge text not null,
  code_challenge_method text not null default 'S256',
  access_token_enc text not null,
  refresh_token_enc text not null,
  expires_at timestamptz not null,
  used_at timestamptz
);

create index if not exists mcp_oauth_codes_expires_at_idx
  on public.mcp_oauth_codes (expires_at)
  where used_at is null;

alter table public.mcp_oauth_clients enable row level security;
alter table public.mcp_oauth_codes enable row level security;

-- No policies: service role only (server-side OAuth)
