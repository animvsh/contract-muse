-- Combined InsForge schema for Contract Muse.
--
-- InsForge is PostgreSQL-compatible and uses the same `auth.uid()` /
-- `auth.jwt()` conventions Supabase does, so the migration scripts are
-- nearly identical to the original Supabase ones.
--
-- How to apply:
--   npx @insforge/cli db push    # or run each .sql file via the dashboard

-- =====================================================================
-- 0001 — Core workspace tables + permissive demo policies
-- =====================================================================

create table public.agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  spec jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  runs_count int not null default 0,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  log text not null default '',
  status text not null default 'completed',
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.team_spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default 'oklch(0.7 0.18 35)',
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.space_members (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.team_spaces(id) on delete cascade,
  email text not null,
  role text not null default 'member',
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.mcp_servers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  description text,
  enabled boolean not null default true,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.connections (
  id uuid primary key default gen_random_uuid(),
  service_id text not null,
  service_name text not null,
  connected boolean not null default false,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- User-edited MCP drafts (mock, like apis).
create table public.mcps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  description text not null default '',
  emoji text not null default '🧩',
  spec jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mcp_invocations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mcp_id uuid not null references public.mcps(id) on delete cascade,
  tool_name text not null,
  arguments jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  status int not null default 200,
  created_at timestamptz not null default now()
);
create index mcp_invocations_mcp_id_idx on public.mcp_invocations(mcp_id, created_at desc);

-- Per-user API playground data.
create table public.apis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  description text not null default '',
  emoji text not null default '🛰️',
  kind text not null default 'rest',
  method text not null default 'GET',
  path text not null,
  spec jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.api_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  api_id uuid not null,
  method text not null,
  path text not null,
  request jsonb not null default '{}'::jsonb,
  response jsonb not null default '{}'::jsonb,
  status integer not null default 200,
  created_at timestamptz not null default now()
);
create index idx_api_requests_api on public.api_requests(api_id, created_at desc);

-- Access keys (used by the MCP playground + access-keys page).
create table public.access_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  client text not null default 'opencode',
  scope text not null default 'workspace',
  scope_label text,
  permission text not null default 'sandbox',
  safety text not null default 'balanced',
  key_prefix text not null,
  key_hash text not null,
  key_plaintext text,
  status text not null default 'active',
  expires_at timestamptz,
  last_used_at timestamptz,
  usage_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.access_key_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  access_key_id uuid not null references public.access_keys(id) on delete cascade,
  kind text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- Profiles table mirrors auth.users.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Waitlist submissions (open to anonymous).
create table public.waitlist_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  full_name text,
  business text,
  goal text,
  phone text,
  linkedin text,
  referral_source text,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create index waitlist_submissions_deleted_at_idx on public.waitlist_submissions(deleted_at);

-- =====================================================================
-- Triggers + helper functions
-- =====================================================================

create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger apis_updated_at before update on public.apis
  for each row execute function public.update_updated_at_column();

create trigger mcps_updated_at before update on public.mcps
  for each row execute function public.update_updated_at_column();

create trigger update_access_keys_updated_at before update on public.access_keys
  for each row execute function public.update_updated_at_column();

-- Auto-create profile on signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name',
             new.raw_user_meta_data->>'name',
             split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.update_updated_at_column() from public, anon, authenticated;

-- =====================================================================
-- Row-level security (per-user + permissive for the waitlist insert path)
-- =====================================================================

alter table public.agents enable row level security;
alter table public.agent_runs enable row level security;
alter table public.team_spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.mcp_servers enable row level security;
alter table public.connections enable row level security;
alter table public.mcps enable row level security;
alter table public.mcp_invocations enable row level security;
alter table public.apis enable row level security;
alter table public.api_requests enable row level security;
alter table public.access_keys enable row level security;
alter table public.access_key_events enable row level security;
alter table public.profiles enable row level security;
alter table public.waitlist_submissions enable row level security;

-- Profiles are visible to everyone; users can edit only their own row.
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Per-user CRUD on workspace tables.
do $$
declare
  t text;
begin
  foreach t in array array[
    'agents','agent_runs','team_spaces','space_members','mcp_servers',
    'connections','mcps','mcp_invocations','apis','api_requests',
    'access_keys','access_key_events'
  ] loop
    execute format(
      'create policy "owner all" on public.%I for all '
      'using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t
    );
  end loop;
end $$;

-- Waitlist: anyone can submit; users see their own; admins see everything.
create policy "anyone can insert waitlist"
  on public.waitlist_submissions for insert with check (true);
create policy "users view own submission"
  on public.waitlist_submissions for select
  using (auth.uid() = user_id);
create policy "admin views all submissions"
  on public.waitlist_submissions for select
  using ((auth.jwt() ->> 'email') in ('aalang@ucsc.edu', 'vansh.chhabra343@gmail.com'));
create policy "admin updates submissions"
  on public.waitlist_submissions for update
  using ((auth.jwt() ->> 'email') in ('aalang@ucsc.edu', 'vansh.chhabra343@gmail.com'))
  with check ((auth.jwt() ->> 'email') in ('aalang@ucsc.edu', 'vansh.chhabra343@gmail.com'));

-- =====================================================================
-- Seed data (idempotent where possible)
-- =====================================================================

insert into public.team_spaces (name, color) values
  ('Engineering', 'oklch(0.6 0.2 250)'),
  ('Product', 'oklch(0.7 0.18 35)'),
  ('Sales', 'oklch(0.7 0.18 145)'),
  ('People & Ops', 'oklch(0.7 0.2 320)');

insert into public.mcp_servers (name, url, description) values
  ('Notion', 'https://mcp.notion.com', 'Pages, databases, and wikis'),
  ('Linear', 'https://mcp.linear.app', 'Issues and cycles'),
  ('Granola', 'https://mcp.granola.ai', 'Meeting notes and transcripts'),
  ('Sentry', 'https://mcp.sentry.io', 'Errors and performance');

insert into public.connections (service_id, service_name, connected) values
  ('notion', 'Notion', true),
  ('slack', 'Slack', true),
  ('gmail', 'Gmail', true),
  ('drive', 'Google Drive', true),
  ('linear', 'Linear', false),
  ('github', 'GitHub', false),
  ('hubspot', 'HubSpot', false),
  ('figma', 'Figma', false),
  ('zoom', 'Zoom', false),
  ('stripe', 'Stripe', false),
  ('salesforce', 'Salesforce', false),
  ('jira', 'Jira', false)
on conflict do nothing;

-- Composite unique so each user only has one row per service.
create unique index if not exists connections_user_service_unique
  on public.connections (user_id, service_id)
  where user_id is not null;

-- =====================================================================
-- InsForge Storage buckets
-- Apply via `npx @insforge/cli storage create-bucket user-uploads --private`
-- then set RLS on storage.objects via the dashboard or another migration.
-- =====================================================================