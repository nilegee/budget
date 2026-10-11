-- Run once in the Supabase SQL editor (Project > SQL).
-- One table holds every record; a shared "household key" (a long random passphrase
-- you and Mariem both type into the app) decides who can read and write which rows.

create table if not exists public.records (
  household_key text        not null,
  kind          text        not null check (kind in ('settings','category','expense','checkin','saving')),
  id            text        not null,
  data          jsonb       not null,
  updated_at    timestamptz not null,
  synced_at     timestamptz not null default now(),
  primary key (household_key, kind, id)
);

create index if not exists records_household_synced on public.records (household_key, synced_at);

-- Server-side stamp so phones with wrong clocks can't hide changes from each other.
create or replace function public.set_synced_at() returns trigger language plpgsql as $$
begin
  new.synced_at := now();
  return new;
end $$;

drop trigger if exists records_synced_at on public.records;
create trigger records_synced_at before insert or update on public.records
  for each row execute function public.set_synced_at();

alter table public.records enable row level security;

drop policy if exists household_access on public.records;
create policy household_access on public.records
  for all
  using      (household_key = coalesce(((current_setting('request.headers', true))::json ->> 'x-household-key'), ''))
  with check (household_key = coalesce(((current_setting('request.headers', true))::json ->> 'x-household-key'), ''));

grant select, insert, update on public.records to anon;
