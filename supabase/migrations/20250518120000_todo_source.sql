-- Todo source: set at create time only; free-form text label

alter table public.todos
  add column if not exists source text;

update public.todos
  set source = 'Claude via MCP'
  where source is null;

alter table public.todos
  alter column source set not null;

alter table public.todos
  add constraint todos_source_nonempty
  check (char_length(trim(source)) > 0);
