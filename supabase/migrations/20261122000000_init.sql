-- KaiCheck: initial schema.
-- Run this once in the Supabase dashboard (SQL Editor) or with `supabase db push`.
-- Every row belongs to one centre. Row-level security keeps each centre's children,
-- dishes and logs invisible to everyone else.

create schema if not exists private;

create type public.app_role as enum ('teacher', 'cook', 'manager');
create type public.meal_slot as enum ('bf', 'mt', 'ln', 'at');

-- ---------------------------------------------------------------- tables

create table public.centres (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  join_code text not null unique
    default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10)),
  created_at timestamptz not null default now()
);

-- A signed-in user with no profile has not joined a centre yet and can see nothing.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  centre_id uuid not null references public.centres (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 80),
  role public.app_role not null default 'teacher',
  created_at timestamptz not null default now()
);
create index profiles_centre_id_idx on public.profiles (centre_id);

create function private.valid_allergies(a jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when jsonb_typeof(a) = 'array' then coalesce((
      select bool_and(
        jsonb_typeof(e) = 'object'
        and (e ->> 'a') = any (array['milk','egg','peanut','tree nut','wheat','soy','fish','shellfish','sesame'])
        and (e ->> 'sev') in ('int', 'ana')
      )
      from jsonb_array_elements(a) as e
    ), true)
    else false
  end
$$;

-- allergies: [{"a": "egg", "sev": "ana"}], sev is 'ana' (anaphylaxis) or 'int' (intolerance)
create table public.children (
  id uuid primary key default gen_random_uuid(),
  centre_id uuid not null references public.centres (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  room text not null default '',
  note text not null default '',
  allergies jsonb not null default '[]'::jsonb check (private.valid_allergies(allergies)),
  created_at timestamptz not null default now()
);
create index children_centre_id_idx on public.children (centre_id);

-- checked = false means nobody has confirmed the allergen tags. The app never treats that as "safe".
create table public.dishes (
  id uuid primary key default gen_random_uuid(),
  centre_id uuid not null references public.centres (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  allergens text[] not null default '{}'
    check (allergens <@ array['milk','egg','peanut','tree nut','wheat','soy','fish','shellfish','sesame']),
  checked boolean not null default false,
  alt text not null default '',
  created_at timestamptz not null default now()
);
create index dishes_centre_id_idx on public.dishes (centre_id);

create table public.food_log (
  id uuid primary key default gen_random_uuid(),
  centre_id uuid not null references public.centres (id) on delete cascade,
  log_date date not null,
  slot public.meal_slot not null,
  dish_id uuid not null references public.dishes (id) on delete restrict,
  logged_by uuid default auth.uid() references public.profiles (id) on delete set null,
  logged_at timestamptz not null default now()
);
create index food_log_centre_date_idx on public.food_log (centre_id, log_date);
create index food_log_dish_id_idx on public.food_log (dish_id);
create index food_log_logged_by_idx on public.food_log (logged_by);

-- One row = this child was given a safe option for this logged dish.
create table public.food_log_confirmations (
  log_id uuid not null references public.food_log (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  confirmed_by uuid default auth.uid() references public.profiles (id) on delete set null,
  confirmed_at timestamptz not null default now(),
  primary key (log_id, child_id)
);
create index food_log_confirmations_child_id_idx on public.food_log_confirmations (child_id);
create index food_log_confirmations_confirmed_by_idx on public.food_log_confirmations (confirmed_by);

-- ---------------------------------------------------------------- helpers
-- Kept in a schema the API does not expose.

create function private.my_centre_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select centre_id from public.profiles where id = (select auth.uid())
$$;

create function private.my_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

revoke all on function private.my_centre_id() from public;
revoke all on function private.my_role() from public;
revoke all on function private.valid_allergies(jsonb) from public;
grant usage on schema private to authenticated;
grant execute on function private.my_centre_id() to authenticated;
grant execute on function private.my_role() to authenticated;
grant execute on function private.valid_allergies(jsonb) to authenticated;

-- ---------------------------------------------------------------- row-level security

alter table public.centres enable row level security;
alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.dishes enable row level security;
alter table public.food_log enable row level security;
alter table public.food_log_confirmations enable row level security;

-- centres
create policy "members read their centre" on public.centres
  for select to authenticated
  using (id = (select private.my_centre_id()));

create policy "managers update their centre" on public.centres
  for update to authenticated
  using (id = (select private.my_centre_id()) and (select private.my_role()) = 'manager')
  with check (id = (select private.my_centre_id()));

-- profiles (rows are created by create_centre / join_centre below, never directly)
create policy "members read colleagues" on public.profiles
  for select to authenticated
  using (centre_id = (select private.my_centre_id()));

create policy "managers update colleagues" on public.profiles
  for update to authenticated
  using (centre_id = (select private.my_centre_id()) and (select private.my_role()) = 'manager')
  with check (centre_id = (select private.my_centre_id()));

create policy "managers remove colleagues" on public.profiles
  for delete to authenticated
  using (
    centre_id = (select private.my_centre_id())
    and (select private.my_role()) = 'manager'
    and id <> (select auth.uid())
  );

-- children: everyone in the centre reads, only managers change
create policy "members read children" on public.children
  for select to authenticated
  using (centre_id = (select private.my_centre_id()));

create policy "managers add children" on public.children
  for insert to authenticated
  with check (centre_id = (select private.my_centre_id()) and (select private.my_role()) = 'manager');

create policy "managers edit children" on public.children
  for update to authenticated
  using (centre_id = (select private.my_centre_id()) and (select private.my_role()) = 'manager')
  with check (centre_id = (select private.my_centre_id()));

create policy "managers remove children" on public.children
  for delete to authenticated
  using (centre_id = (select private.my_centre_id()) and (select private.my_role()) = 'manager');

-- dishes: everyone reads, cooks and managers change
create policy "members read dishes" on public.dishes
  for select to authenticated
  using (centre_id = (select private.my_centre_id()));

create policy "cooks add dishes" on public.dishes
  for insert to authenticated
  with check (centre_id = (select private.my_centre_id()) and (select private.my_role()) in ('cook', 'manager'));

create policy "cooks edit dishes" on public.dishes
  for update to authenticated
  using (centre_id = (select private.my_centre_id()) and (select private.my_role()) in ('cook', 'manager'))
  with check (centre_id = (select private.my_centre_id()));

create policy "cooks remove dishes" on public.dishes
  for delete to authenticated
  using (centre_id = (select private.my_centre_id()) and (select private.my_role()) in ('cook', 'manager'));

-- food log: any staff member logs and can remove a mistaken entry
create policy "members read food log" on public.food_log
  for select to authenticated
  using (centre_id = (select private.my_centre_id()));

create policy "members log food" on public.food_log
  for insert to authenticated
  with check (
    centre_id = (select private.my_centre_id())
    and logged_by = (select auth.uid())
    and exists (
      select 1 from public.dishes d
      where d.id = food_log.dish_id and d.centre_id = food_log.centre_id
    )
  );

create policy "members remove log entries" on public.food_log
  for delete to authenticated
  using (centre_id = (select private.my_centre_id()));

-- confirmations
create policy "members read confirmations" on public.food_log_confirmations
  for select to authenticated
  using (exists (
    select 1 from public.food_log l
    where l.id = food_log_confirmations.log_id and l.centre_id = (select private.my_centre_id())
  ));

create policy "members confirm" on public.food_log_confirmations
  for insert to authenticated
  with check (
    confirmed_by = (select auth.uid())
    and exists (
      select 1 from public.food_log l
      where l.id = food_log_confirmations.log_id and l.centre_id = (select private.my_centre_id())
    )
    and exists (
      select 1 from public.children c
      where c.id = food_log_confirmations.child_id and c.centre_id = (select private.my_centre_id())
    )
  );

create policy "members unconfirm" on public.food_log_confirmations
  for delete to authenticated
  using (exists (
    select 1 from public.food_log l
    where l.id = food_log_confirmations.log_id and l.centre_id = (select private.my_centre_id())
  ));

-- ---------------------------------------------------------------- table privileges
-- RLS decides which rows; these grants decide which operations. Signed-out visitors get nothing.

revoke all on public.centres, public.profiles, public.children, public.dishes,
  public.food_log, public.food_log_confirmations from anon;

grant select, update on public.centres to authenticated;
grant select, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.children to authenticated;
grant select, insert, update, delete on public.dishes to authenticated;
grant select, insert, delete on public.food_log to authenticated;
grant select, insert, delete on public.food_log_confirmations to authenticated;

-- ---------------------------------------------------------------- onboarding functions
-- These need to bypass RLS (a new user has no profile yet), so each checks who is calling.

create function public.create_centre(centre_name text, display_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  cid uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;
  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'You already belong to a centre';
  end if;

  insert into public.centres (name) values (trim(centre_name)) returning id into cid;
  insert into public.profiles (id, centre_id, full_name, role)
  values (auth.uid(), cid, trim(display_name), 'manager');
  return cid;
end;
$$;

create function public.join_centre(code text, display_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  cid uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;
  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'You already belong to a centre';
  end if;

  select id into cid from public.centres where join_code = upper(trim(code));
  if cid is null then
    raise exception 'That join code was not found';
  end if;

  -- Joiners start as teachers. A manager can promote them.
  insert into public.profiles (id, centre_id, full_name, role)
  values (auth.uid(), cid, trim(display_name), 'teacher');
  return cid;
end;
$$;

create function public.rotate_join_code()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_code text;
begin
  if (select private.my_role()) is distinct from 'manager' then
    raise exception 'Only a manager can change the join code';
  end if;

  update public.centres
  set join_code = upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10))
  where id = (select private.my_centre_id())
  returning join_code into new_code;
  return new_code;
end;
$$;

revoke all on function public.create_centre(text, text) from public, anon;
revoke all on function public.join_centre(text, text) from public, anon;
revoke all on function public.rotate_join_code() from public, anon;
grant execute on function public.create_centre(text, text) to authenticated;
grant execute on function public.join_centre(text, text) to authenticated;
grant execute on function public.rotate_join_code() to authenticated;

-- ---------------------------------------------------------------- realtime
-- Lets a second tablet see new log entries without refreshing. RLS still applies.

alter publication supabase_realtime add table public.food_log, public.food_log_confirmations;
