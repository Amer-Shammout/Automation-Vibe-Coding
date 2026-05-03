create table if not exists public.app_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

create policy "Public read app state"
on public.app_state
for select
using (true);

create policy "Public insert app state"
on public.app_state
for insert
with check (true);

create policy "Public update app state"
on public.app_state
for update
using (true)
with check (true);

-- Automations table
create table if not exists public.automations (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.automations enable row level security;

create policy "Public read automations"
on public.automations for select using (true);

create policy "Public insert automations"
on public.automations for insert with check (true);

create policy "Public update automations"
on public.automations for update using (true) with check (true);

create policy "Public delete automations"
on public.automations for delete using (true);

-- Executions table
create table if not exists public.executions (
  id text primary key,
  automation_id text not null references public.automations(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.executions enable row level security;

create policy "Public read executions"
on public.executions for select using (true);

create policy "Public insert executions"
on public.executions for insert with check (true);

create policy "Public update executions"
on public.executions for update using (true) with check (true);

create policy "Public delete executions"
on public.executions for delete using (true);

