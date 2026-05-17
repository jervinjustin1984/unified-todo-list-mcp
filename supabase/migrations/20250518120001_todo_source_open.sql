-- Open-ended source labels (drop enum allowlist if 20250518120000 was applied with todos_source_check)

alter table public.todos drop constraint if exists todos_source_check;

alter table public.todos drop constraint if exists todos_source_nonempty;

alter table public.todos
  add constraint todos_source_nonempty
  check (char_length(trim(source)) > 0);
