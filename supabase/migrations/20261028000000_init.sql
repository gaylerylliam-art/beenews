-- BeeNews — initial schema
-- Accounts come from Supabase Auth (auth.users). Everything below lives in the public schema
-- and is protected by Row Level Security.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Reference values
-- ---------------------------------------------------------------------------
create type public.section_name as enum
  ('AI','GCC','Health & Wellness','Sports & Events','Politics','Cars');
create type public.verification_label as enum
  ('official','corroborated','developing','single');
create type public.publish_status as enum
  ('draft','in_review','published','retracted');

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text check (char_length(display_name) <= 80),
  created_at    timestamptz not null default now()
);

create table public.user_preferences (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  language        text not null default 'en' check (language in ('en','ar','fr','de')),
  sections        text[] not null default '{}',
  countries       text[] not null default '{}',
  horoscope_sign  text check (horoscope_sign in ('aries','taurus','gemini','cancer','leo','virgo','libra',
                                                 'scorpio','sagittarius','capricorn','aquarius','pisces')),
  currencies      text[] not null default '{INR,EUR,GBP}',
  updated_at      timestamptz not null default now()
);

-- Editors can create, review and approve content. Add rows here from the dashboard.
create table public.editors (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  added_at   timestamptz not null default now()
);

create or replace function public.is_editor()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.editors where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------
create table public.stories (
  id               text primary key,
  section          public.section_name not null,
  country          text not null,
  label            public.verification_label not null,
  sensitive        boolean not null default false,   -- health and political stories
  editor_approved  boolean not null default false,
  approved_by      uuid references auth.users(id),
  approved_at      timestamptz,
  headline         text not null,
  summary          text not null,
  publisher        text not null,
  published_at     timestamptz not null,
  date_only        boolean not null default false,
  url              text not null check (url ~ '^https?://'),
  link_is_section  boolean not null default false,  -- link opens the publisher's section page
  also_reported    text,
  is_lead          boolean not null default false,
  translations     jsonb not null default '{}'::jsonb, -- {"ar":["headline","summary"], "fr":[...], "de":[...]}
  status           public.publish_status not null default 'draft',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- The editorial rule: a sensitive story cannot be published until an editor approves it.
  constraint sensitive_needs_approval
    check (status <> 'published' or not sensitive or editor_approved)
);
create index stories_published_idx on public.stories (status, published_at desc);
create index stories_section_idx   on public.stories (section);
create index stories_country_idx   on public.stories (country);

create table public.story_corrections (
  id            bigint generated always as identity primary key,
  story_id      text not null references public.stories(id) on delete cascade,
  note          text not null,
  corrected_at  timestamptz not null default now(),
  corrected_by  uuid references auth.users(id)
);

create table public.events (
  id            text primary key,
  name          text not null,
  category      text not null check (category in ('Exhibitions & art','Culture & shows','Education','Trade & industry','Family')),
  emirate       text not null check (emirate in ('Abu Dhabi','Dubai','Sharjah','Nationwide','Ajman','Ras Al Khaimah','Fujairah','Umm Al Quwain')),
  start_date    date,
  end_date      date,
  end_approx    boolean not null default false,
  venue         text not null,
  entry         text not null,
  description   text not null,
  label         public.verification_label not null,
  publisher     text not null,
  url           text not null check (url ~ '^https?://'),
  also_reported text,
  rescheduled   boolean not null default false,
  translations  jsonb not null default '{}'::jsonb, -- {"ar":["name","description"], ...}
  status        public.publish_status not null default 'published',
  updated_at    timestamptz not null default now()
);

-- Markets snapshot (update daily from a licensed data feed)
create table public.fx_rates (
  code          text primary key check (code ~ '^[A-Z]{3}$'),
  aed_per_unit  numeric not null check (aed_per_unit > 0),
  per_units     integer not null default 1,
  source        text not null,
  as_of         text not null,        -- ISO date, or 'fixed' for pegged currencies
  sort          integer not null default 0
);

create table public.market_quotes (
  id          text primary key,
  kind        text not null check (kind in ('gulf','global','commodity')),
  name        text not null,
  country_key text,                   -- e.g. 'c:UAE' (gulf only)
  value       numeric not null,
  change_pct  numeric not null,
  as_of       date not null,
  sort        integer not null default 0
);

create table public.horoscopes (
  day    date not null,
  sign   text not null,
  lang   text not null check (lang in ('en','ar','fr','de')),
  body   text not null,
  primary key (day, sign, lang)
);

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger stories_touch before update on public.stories for each row execute function public.touch_updated_at();
create trigger events_touch  before update on public.events  for each row execute function public.touch_updated_at();
create trigger prefs_touch   before update on public.user_preferences for each row execute function public.touch_updated_at();

-- record who approved a sensitive story
create or replace function public.stamp_approval()
returns trigger language plpgsql as $$
begin
  if new.editor_approved and not coalesce(old.editor_approved,false) then
    new.approved_by = auth.uid(); new.approved_at = now();
  end if;
  return new;
end $$;
create trigger stories_stamp_approval before update on public.stories for each row execute function public.stamp_approval();

-- ---------------------------------------------------------------------------
-- New account → profile + default preferences
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
    values (new.id, left(coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)), 80));
  insert into public.user_preferences (user_id, language)
    values (new.id, coalesce(nullif(new.raw_user_meta_data->>'language',''),'en'))
    on conflict (user_id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users can delete their own account (removes profile and preferences by cascade).
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.user_preferences   enable row level security;
alter table public.editors            enable row level security;
alter table public.stories            enable row level security;
alter table public.story_corrections  enable row level security;
alter table public.events             enable row level security;
alter table public.fx_rates           enable row level security;
alter table public.market_quotes      enable row level security;
alter table public.horoscopes         enable row level security;

-- Own profile and preferences only
create policy "own profile: read"    on public.profiles for select using (auth.uid() = id);
create policy "own profile: update"  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "own prefs: read"      on public.user_preferences for select using (auth.uid() = user_id);
create policy "own prefs: insert"    on public.user_preferences for insert with check (auth.uid() = user_id);
create policy "own prefs: update"    on public.user_preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Editors table: editors can see who else is an editor; changes only via dashboard/service role
create policy "editors: read" on public.editors for select using (public.is_editor());

-- Published content is public; editors see and manage everything
create policy "stories: public read"  on public.stories for select using (status = 'published' or public.is_editor());
create policy "stories: editor write" on public.stories for all using (public.is_editor()) with check (public.is_editor());
create policy "corrections: public read"  on public.story_corrections for select using (true);
create policy "corrections: editor write" on public.story_corrections for insert with check (public.is_editor());
create policy "events: public read"   on public.events for select using (status = 'published' or public.is_editor());
create policy "events: editor write"  on public.events for all using (public.is_editor()) with check (public.is_editor());
create policy "fx: public read"       on public.fx_rates for select using (true);
create policy "fx: editor write"      on public.fx_rates for all using (public.is_editor()) with check (public.is_editor());
create policy "quotes: public read"   on public.market_quotes for select using (true);
create policy "quotes: editor write"  on public.market_quotes for all using (public.is_editor()) with check (public.is_editor());
create policy "horoscopes: public read"  on public.horoscopes for select using (true);
create policy "horoscopes: editor write" on public.horoscopes for all using (public.is_editor()) with check (public.is_editor());
