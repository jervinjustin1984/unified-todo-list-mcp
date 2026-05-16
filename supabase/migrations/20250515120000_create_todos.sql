-- Todos table for unified todo list (single user v1: default user_id)
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'jervinjustin',
  name text not null,
  created_at timestamptz not null default now(),
  status text not null default 'open',
  priority text not null default 'medium',
  category text,
  completed_at timestamptz,
  archived_at timestamptz,
  constraint todos_status_check check (status in ('open', 'in_progress', 'completed')),
  constraint todos_priority_check check (priority in ('low', 'medium', 'high')),
  constraint todos_name_nonempty check (char_length(trim(name)) > 0)
);

create index if not exists todos_user_created_desc on public.todos (user_id, created_at desc);
create index if not exists todos_user_active on public.todos (user_id) where archived_at is null;
create index if not exists todos_user_archived on public.todos (user_id, archived_at desc) where archived_at is not null;

comment on table public.todos is 'Personal todos; archive is soft-delete (archived_at set).';
