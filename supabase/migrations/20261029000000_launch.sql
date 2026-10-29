-- BeeNews — launch features
-- Run after 20261028000000_init.sql. Safe to run once; uses IF NOT EXISTS where Postgres allows.

-- ---------------------------------------------------------------------------
-- Stories: longer BeeNews brief, ingestion metadata
-- ---------------------------------------------------------------------------
alter table public.stories add column if not exists brief text;
alter table public.stories add column if not exists brief_translations jsonb not null default '{}'::jsonb; -- {"ar":"…","fr":"…","de":"…"}
alter table public.stories add column if not exists source_candidate bigint;
alter table public.stories add column if not exists breaking boolean not null default false;

-- ---------------------------------------------------------------------------
-- Consent recorded with each account
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists terms_version text;
alter table public.profiles add column if not exists terms_accepted_at timestamptz;
alter table public.profiles add column if not exists marketing_opt_in boolean not null default false;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, terms_version, terms_accepted_at, marketing_opt_in)
    values (new.id,
            left(coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)), 80),
            nullif(new.raw_user_meta_data->>'terms_version',''),
            case when coalesce(new.raw_user_meta_data->>'terms_version','') <> '' then now() end,
            coalesce((new.raw_user_meta_data->>'marketing_opt_in')::boolean, false));
  insert into public.user_preferences (user_id, language)
    values (new.id, coalesce(nullif(new.raw_user_meta_data->>'language',''),'en'))
    on conflict (user_id) do nothing;
  return new;
end $$;

-- Accounts created with Google/Apple accept the terms on first sign-in.
create or replace function public.accept_terms(version text, marketing boolean default false)
returns void language sql security definer set search_path = public as $$
  update public.profiles set terms_version = left(version, 20), terms_accepted_at = now(), marketing_opt_in = marketing
  where id = auth.uid();
$$;
revoke all on function public.accept_terms(text, boolean) from public, anon;
grant execute on function public.accept_terms(text, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Saved stories and reading history (per account)
-- ---------------------------------------------------------------------------
create table if not exists public.saved_stories (
  user_id   uuid not null references auth.users(id) on delete cascade,
  story_id  text not null,
  saved_at  timestamptz not null default now(),
  primary key (user_id, story_id)
);
create table if not exists public.reading_history (
  user_id   uuid not null references auth.users(id) on delete cascade,
  story_id  text not null,
  read_at   timestamptz not null default now(),
  primary key (user_id, story_id)
);
create index if not exists reading_history_recent on public.reading_history (user_id, read_at desc);
alter table public.saved_stories   enable row level security;
alter table public.reading_history enable row level security;
create policy "saved: own" on public.saved_stories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "history: own" on public.reading_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- keep only the latest 200 history rows per reader
create or replace function public.trim_history()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.reading_history
   where user_id = new.user_id
     and story_id in (select story_id from public.reading_history where user_id = new.user_id
                      order by read_at desc offset 200);
  return null;
end $$;
drop trigger if exists history_trim on public.reading_history;
create trigger history_trim after insert on public.reading_history for each row execute function public.trim_history();

-- ---------------------------------------------------------------------------
-- "Report an error" inbox
-- ---------------------------------------------------------------------------
create table if not exists public.error_reports (
  id            bigint generated always as identity primary key,
  story_id      text,
  kind          text not null check (kind in ('factual','translation','link','offensive','other','contact')),
  message       text not null check (char_length(message) between 5 and 2000),
  contact_email text check (contact_email is null or contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  user_id       uuid references auth.users(id) on delete set null,
  status        text not null default 'new' check (status in ('new','reviewing','corrected','rejected')),
  editor_note   text,
  handled_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  handled_at    timestamptz
);
alter table public.error_reports enable row level security;
create policy "reports: anyone can submit" on public.error_reports for insert
  with check (status = 'new' and handled_by is null and (user_id is null or user_id = auth.uid()));
create policy "reports: editors read"   on public.error_reports for select using (public.is_editor());
create policy "reports: editors update" on public.error_reports for update using (public.is_editor()) with check (public.is_editor());

-- simple flood protection: at most 30 reports per story per hour, 300 overall per hour
create or replace function public.limit_reports()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.error_reports where created_at > now() - interval '1 hour') >= 300
     or (select count(*) from public.error_reports where story_id is not distinct from new.story_id
           and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'Too many reports right now. Please try again later.';
  end if;
  return new;
end $$;
drop trigger if exists reports_limit on public.error_reports;
create trigger reports_limit before insert on public.error_reports for each row execute function public.limit_reports();

-- ---------------------------------------------------------------------------
-- Approved sources and the ingestion queue (daily pipeline)
-- ---------------------------------------------------------------------------
create table if not exists public.sources (
  id              bigint generated always as identity primary key,
  name            text not null,
  homepage        text not null check (homepage ~ '^https?://'),
  feed_url        text check (feed_url is null or feed_url ~ '^https?://'),
  kind            text not null check (kind in ('official','agency','newsroom','science','secondary')),
  default_section text,
  default_country text,
  permission      text not null default 'link-only' check (permission in ('link-only','headline-summary','full-text-licensed')),
  permission_note text,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);
create table if not exists public.story_candidates (
  id           bigint generated always as identity primary key,
  source_id    bigint references public.sources(id) on delete set null,
  title        text not null,
  url          text not null unique check (url ~ '^https?://'),
  excerpt      text,          -- the feed's own description, for the editor only; never published
  published_at timestamptz,
  fetched_at   timestamptz not null default now(),
  status       text not null default 'new' check (status in ('new','drafted','dismissed')),
  story_id     text
);
create index if not exists candidates_new on public.story_candidates (status, published_at desc);
alter table public.sources          enable row level security;
alter table public.story_candidates enable row level security;
create policy "sources: editors" on public.sources for all using (public.is_editor()) with check (public.is_editor());
create policy "candidates: editors" on public.story_candidates for all using (public.is_editor()) with check (public.is_editor());

-- ---------------------------------------------------------------------------
-- Audit log of editorial actions
-- ---------------------------------------------------------------------------
create table if not exists public.story_events (
  id        bigint generated always as identity primary key,
  story_id  text not null,
  action    text not null,
  actor     uuid,
  at        timestamptz not null default now(),
  detail    jsonb
);
alter table public.story_events enable row level security;
create policy "events log: editors read" on public.story_events for select using (public.is_editor());

create or replace function public.log_story_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.story_events (story_id, action, actor, detail) values (new.id, 'created', auth.uid(), jsonb_build_object('status', new.status));
  elsif new.status is distinct from old.status then
    insert into public.story_events (story_id, action, actor, detail) values (new.id, 'status', auth.uid(), jsonb_build_object('from', old.status, 'to', new.status));
  elsif (new.headline, new.summary, coalesce(new.brief,''), new.label) is distinct from (old.headline, old.summary, coalesce(old.brief,''), old.label) then
    insert into public.story_events (story_id, action, actor, detail) values (new.id, 'edited', auth.uid(), null);
  end if;
  return new;
end $$;
drop trigger if exists stories_log on public.stories;
create trigger stories_log after insert or update on public.stories for each row execute function public.log_story_change();

-- ---------------------------------------------------------------------------
-- Breaking-news alerts (web push subscriptions)
-- ---------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  endpoint   text primary key,
  user_id    uuid references auth.users(id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  sections   text[] not null default '{}',
  lang       text not null default 'en',
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
create policy "push: own" on public.push_subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Privacy-respecting analytics: daily counters only, no user IDs, no IP addresses
-- ---------------------------------------------------------------------------
create table if not exists public.metrics_daily (
  day    date not null default (now() at time zone 'Asia/Dubai')::date,
  event  text not null,
  key    text not null default '',
  count  bigint not null default 0,
  primary key (day, event, key)
);
alter table public.metrics_daily enable row level security;
create policy "metrics: editors read" on public.metrics_daily for select using (public.is_editor());

create or replace function public.track(event_name text, event_key text default '')
returns void language plpgsql security definer set search_path = public as $$
begin
  if event_name not in ('page_view','section_open','story_open','listen','save','share','search','signup','report_error','install') then return; end if;
  insert into public.metrics_daily as m (event, key, count) values (event_name, left(coalesce(event_key,''), 80), 1)
  on conflict on constraint metrics_daily_pkey do update set count = m.count + 1;
end $$;
grant execute on function public.track(text, text) to anon, authenticated;

-- Crash reporting: short error messages from the app, editors can read them
create table if not exists public.client_errors (
  id       bigint generated always as identity primary key,
  at       timestamptz not null default now(),
  message  text not null,
  source   text,
  page     text,
  agent    text
);
alter table public.client_errors enable row level security;
create policy "errors: editors read" on public.client_errors for select using (public.is_editor());

create or replace function public.log_client_error(message text, source text default null, page text default null, agent text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.client_errors where at > now() - interval '1 hour') >= 500 then return; end if;
  insert into public.client_errors (message, source, page, agent)
  values (left(message, 500), left(source, 300), left(page, 200), left(agent, 160));
end $$;
grant execute on function public.log_client_error(text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- "Ask BeeNews" assistant: daily usage cap per account
-- ---------------------------------------------------------------------------
create table if not exists public.assistant_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null default (now() at time zone 'Asia/Dubai')::date,
  count   integer not null default 0,
  primary key (user_id, day)
);
alter table public.assistant_usage enable row level security;
create policy "assistant: own read" on public.assistant_usage for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Starter list of approved sources (feeds can be added by editors in the dashboard)
-- ---------------------------------------------------------------------------
insert into public.sources (name, homepage, kind, default_section, default_country, permission, permission_note)
select * from (values
  ('WAM – Emirates News Agency', 'https://www.wam.ae', 'official', 'GCC', 'UAE', 'link-only', 'Check WAM reuse terms before using full text'),
  ('Philippine News Agency', 'https://www.pna.gov.ph', 'official', 'Politics', 'Philippines', 'link-only', null),
  ('Maroc.ma (MAP)', 'https://maroc.ma/en/news', 'official', 'Politics', 'Morocco', 'link-only', null),
  ('World Health Organization', 'https://www.who.int/news-room', 'official', 'Health & Wellness', 'International', 'link-only', null),
  ('The National', 'https://www.thenationalnews.com', 'newsroom', 'GCC', 'UAE', 'link-only', null),
  ('Gulf News', 'https://gulfnews.com', 'newsroom', 'GCC', 'UAE', 'link-only', null),
  ('Khaleej Times', 'https://www.khaleejtimes.com', 'newsroom', 'GCC', 'UAE', 'link-only', null)
) as v(name, homepage, kind, default_section, default_country, permission, permission_note)
where not exists (select 1 from public.sources);

-- ---------------------------------------------------------------------------
-- Approval stamp also on insert (stories created already approved in the dashboard)
-- ---------------------------------------------------------------------------
create or replace function public.stamp_approval()
returns trigger language plpgsql as $$
begin
  if new.editor_approved and (tg_op = 'INSERT' or not coalesce(old.editor_approved,false)) then
    new.approved_by = auth.uid(); new.approved_at = now();
  end if;
  if not new.editor_approved then new.approved_by = null; new.approved_at = null; end if;
  new.updated_at = now();
  return new;
end $$;
drop trigger if exists stories_stamp_approval on public.stories;
create trigger stories_stamp_approval before insert or update on public.stories for each row execute function public.stamp_approval();
