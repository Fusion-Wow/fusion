-- ─── Extensions ─────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Players ─────────────────────────────────────────────────────────────────
create table public.players (
  id            uuid primary key default uuid_generate_v4(),
  character_name text not null,
  class         text not null,
  spec          text not null,
  role          text not null check (role in ('tank', 'healer', 'dps')),
  team          text not null check (team in ('Z', 'M', 'T', 'Y', 'V', 'A')),
  active        boolean not null default true,
  wcl_id        text,  -- WarcraftLogs actor name or ID for matching
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── Weeks ───────────────────────────────────────────────────────────────────
create table public.weeks (
  id                  uuid primary key default uuid_generate_v4(),
  week_number         integer not null,
  reset_date          date not null,        -- Tuesday of that week
  picks_open_at       timestamptz not null, -- Tuesday 8am EST
  picks_close_at      timestamptz not null, -- Tuesday 8pm EST
  status              text not null default 'upcoming'
                        check (status in ('upcoming', 'open', 'locked', 'scoring', 'complete')),
  winner_user_id      uuid references auth.users(id),
  winner_announced_at timestamptz,
  created_at          timestamptz not null default now()
);

-- ─── Picks ───────────────────────────────────────────────────────────────────
create table public.picks (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  week_id      uuid not null references public.weeks(id),
  tank_id      uuid not null references public.players(id),
  healer_id    uuid not null references public.players(id),
  dps1_id      uuid not null references public.players(id),
  dps2_id      uuid not null references public.players(id),
  dps3_id      uuid not null references public.players(id),
  locked       boolean not null default false,
  submitted_at timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, week_id)  -- one roster per user per week
);

-- ─── Player Week Scores ───────────────────────────────────────────────────────
create table public.player_scores (
  id               uuid primary key default uuid_generate_v4(),
  player_id        uuid not null references public.players(id),
  week_id          uuid not null references public.weeks(id),
  parse_score      numeric(5,2) not null default 0,
  activity_score   numeric(5,2) not null default 0,
  mechanic_score   numeric(5,2) not null default 0,
  death_score      numeric(5,2) not null default 0,
  explosive_score  numeric(5,2) not null default 0,
  total_score      numeric(6,2) not null default 0,
  score_breakdown  jsonb,   -- full ScoreBreakdown object
  computed_at      timestamptz not null default now(),
  unique (player_id, week_id)
);

-- ─── Mechanic Definitions (config-driven, mirrors TypeScript types) ───────────
-- These can also live in code (mechanics.ts) but storing in DB allows
-- lead-configurable scoring without redeploys.
create table public.mechanic_definitions (
  id               text primary key,  -- e.g. 'mag_cube_click'
  boss             text not null,
  name             text not null,
  mechanic_type    text not null,
  description      text,
  wcl_filter       jsonb not null,    -- WCLMechanicFilter
  scoring_rule     jsonb not null,    -- MechanicScoringRule
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

-- ─── RLS Policies ────────────────────────────────────────────────────────────
alter table public.players          enable row level security;
alter table public.weeks            enable row level security;
alter table public.picks            enable row level security;
alter table public.player_scores    enable row level security;
alter table public.mechanic_definitions enable row level security;

-- Players: readable by all authenticated users
create policy "Players readable by authenticated"
  on public.players for select
  to authenticated using (true);

-- Weeks: readable by all authenticated users
create policy "Weeks readable by authenticated"
  on public.weeks for select
  to authenticated using (true);

-- Picks: users can only read/write their own picks
create policy "Own picks readable"
  on public.picks for select
  to authenticated using (auth.uid() = user_id);

create policy "Own picks insertable"
  on public.picks for insert
  to authenticated with check (auth.uid() = user_id);

create policy "Own picks updatable when unlocked"
  on public.picks for update
  to authenticated using (auth.uid() = user_id and locked = false);

-- Scores: readable by all authenticated users
create policy "Scores readable by authenticated"
  on public.player_scores for select
  to authenticated using (true);

-- Mechanic definitions: readable by all
create policy "Mechanic definitions readable"
  on public.mechanic_definitions for select
  to authenticated using (true);

-- ─── Seed: initial Magtheridon mechanic ──────────────────────────────────────
insert into public.mechanic_definitions (id, boss, name, mechanic_type, description, wcl_filter, scoring_rule)
values (
  'mag_cube_click',
  'Magtheridon',
  'Cube Click',
  'debuff_timing',
  'Player must click a Cube of Force in sync with the group and hold for the full duration.',
  '{"debuff_id": 30282, "debuff_name": "Shadow Grasp", "event_type": "applydebuff"}',
  '{"sync_tolerance_ms": 2500, "min_hold_percent": 80, "tiers": [{"min_percent": 100, "score": 100}, {"min_percent": 80, "score": 75}, {"min_percent": 50, "score": 40}, {"min_percent": 0, "score": 0}]}'
);
