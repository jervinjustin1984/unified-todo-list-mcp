-- Multi-user: user_id = Supabase auth.users UUID + RLS
--
-- BEFORE running (if you have existing todos with text user_id like 'jervinjustin'):
--   1. Create your user in Supabase Auth (Dashboard → Authentication → Users).
--   2. Run: UPDATE public.todos SET user_id_uuid = '<your-auth-user-uuid>'::uuid
--          WHERE user_id_uuid IS NULL;
--   3. Then run the "finalize" statements at the bottom of this file (or migration 20250516120001).

alter table public.todos alter column user_id drop default;

alter table public.todos
  add column if not exists user_id_uuid uuid references auth.users (id) on delete cascade;

-- Optional: copy if user_id column already stores UUID strings
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'todos'
      and column_name = 'user_id'
      and data_type = 'text'
  ) then
    update public.todos
    set user_id_uuid = user_id::uuid
    where user_id_uuid is null
      and user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  end if;
end $$;

alter table public.todos drop column if exists user_id;

alter table public.todos rename column user_id_uuid to user_id;

-- After backfill, enforce NOT NULL (uncomment when ready):
-- alter table public.todos alter column user_id set not null;

alter table public.todos enable row level security;

drop policy if exists todos_select_own on public.todos;
drop policy if exists todos_insert_own on public.todos;
drop policy if exists todos_update_own on public.todos;
drop policy if exists todos_delete_own on public.todos;

create policy todos_select_own
  on public.todos
  for select
  using (auth.uid() = user_id);

create policy todos_insert_own
  on public.todos
  for insert
  with check (auth.uid() = user_id);

create policy todos_update_own
  on public.todos
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy todos_delete_own
  on public.todos
  for delete
  using (auth.uid() = user_id);

comment on table public.todos is 'Per-user todos; user_id = auth.users.id; archive via archived_at.';
