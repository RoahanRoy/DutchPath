-- 0008_settle_schema.sql
--
-- Data foundation for the Settle track (Expat OS): the Netherlands admin
-- surface that runs alongside the exam tracks (arrival stack, 30% ruling,
-- healthcare, residency).
--
-- Design notes that are easy to get wrong later:
--
--  1. Everything lives in `public` with a `settle_` prefix. PostgREST only
--     exposes schemas it is configured for, so a separate `settle` schema
--     would be invisible to the client.
--
--  2. Regulatory content is DATA, not branches. A `settle_rules` row carries
--     its own trigger conditions, deadline offset and validity window
--     (effective_from / effective_to). Superseding a rule means inserting a
--     new row and closing the old one — never editing in place, and never
--     adding an `if (…)` in TypeScript.
--
--  3. `settle_timeline_items.rule_key` is deliberately plain text with NO
--     foreign key to settle_rules(key). A user's timeline has to survive a
--     rule being superseded, which is the entire point of the validity
--     window. An FK would couple them and cascade away user history.
--
--  4. No SECURITY DEFINER functions here, unlike 0006/0007. Those exist to
--     protect privileged counters on `profiles` (xp_total, role) that a user
--     must not write directly. Every settle_ user table is owner-scoped with
--     no privileged columns, so plain RLS-guarded table writes are correct.
--
--  5. Policies use the init-plan form `(select auth.uid())`, matching the
--     rewrite in 0005. The bare `auth.uid()` shape from 0001 re-evaluates the
--     function once per row and re-introduces the `auth_rls_initplan`
--     advisor warning.

begin;

-- ── 1. settle_rules — immutable reference content ───────────────────────────
-- Shared by every user, seeded with the service-role key, read through the
-- unstable_cache pattern in lib/settle/rules.ts.

create table if not exists public.settle_rules (
  id bigserial primary key,
  key text not null unique,
  category text not null check (category in ('arrival','money','health','mobility','housing','status')),
  title_en text not null,
  summary_en text not null,
  body_en text not null,
  official_url text,
  trigger_conditions jsonb not null default '{}'::jsonb,
  offset_days integer,
  offset_from text check (offset_from in ('arrival','permit_start','registration','fixed_date')),
  fixed_date date,
  severity text not null check (severity in ('blocking','costly','routine')),
  effective_from date not null,
  effective_to date,
  created_at timestamptz not null default now()
);

create index if not exists settle_rules_category_effective_idx
  on public.settle_rules (category, effective_from);

-- ── 2. settle_profile — one row per user ────────────────────────────────────

create table if not exists public.settle_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  arrival_date date,
  permit_type text,
  nationality_group text,
  employer_type text,
  has_30_percent_ruling boolean not null default false,
  has_bsn boolean not null default false,
  has_digid boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── 3. settle_timeline_items — generated per user ───────────────────────────

create table if not exists public.settle_timeline_items (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  rule_key text not null,
  due_date date,
  status text not null default 'upcoming'
    check (status in ('upcoming','due','done','skipped','not_applicable')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, rule_key)
);

create index if not exists settle_timeline_items_user_due_idx
  on public.settle_timeline_items (user_id, due_date);

-- ── 4. settle_documents — metadata only ─────────────────────────────────────
-- The file itself lives in Storage; this table only records where it is.

create table if not exists public.settle_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rule_key text,
  label text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

-- Covering index for the user_id FK. 0005 added these across every other table
-- to cut Disk IO on the free-tier compute; a new FK without one re-opens the
-- `unindexed_foreign_keys` advisor finding.
create index if not exists settle_documents_user_idx
  on public.settle_documents (user_id);

-- ── 5. RLS ──────────────────────────────────────────────────────────────────

alter table public.settle_rules enable row level security;
alter table public.settle_profile enable row level security;
alter table public.settle_timeline_items enable row level security;
alter table public.settle_documents enable row level security;

-- settle_rules: readable by any signed-in user, writable by no one. Seeding
-- goes through the service-role key, which bypasses RLS entirely.
drop policy if exists settle_rules_select_authenticated on public.settle_rules;
create policy settle_rules_select_authenticated on public.settle_rules
  for select to authenticated using (true);

-- settle_profile — owner only.
drop policy if exists settle_profile_select_own on public.settle_profile;
create policy settle_profile_select_own on public.settle_profile
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists settle_profile_insert_own on public.settle_profile;
create policy settle_profile_insert_own on public.settle_profile
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists settle_profile_update_own on public.settle_profile;
create policy settle_profile_update_own on public.settle_profile
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists settle_profile_delete_own on public.settle_profile;
create policy settle_profile_delete_own on public.settle_profile
  for delete to authenticated using ((select auth.uid()) = user_id);

-- settle_timeline_items — owner only.
drop policy if exists settle_timeline_select_own on public.settle_timeline_items;
create policy settle_timeline_select_own on public.settle_timeline_items
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists settle_timeline_insert_own on public.settle_timeline_items;
create policy settle_timeline_insert_own on public.settle_timeline_items
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists settle_timeline_update_own on public.settle_timeline_items;
create policy settle_timeline_update_own on public.settle_timeline_items
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists settle_timeline_delete_own on public.settle_timeline_items;
create policy settle_timeline_delete_own on public.settle_timeline_items
  for delete to authenticated using ((select auth.uid()) = user_id);

-- settle_documents — owner only.
drop policy if exists settle_documents_select_own on public.settle_documents;
create policy settle_documents_select_own on public.settle_documents
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists settle_documents_insert_own on public.settle_documents;
create policy settle_documents_insert_own on public.settle_documents
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists settle_documents_update_own on public.settle_documents;
create policy settle_documents_update_own on public.settle_documents
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists settle_documents_delete_own on public.settle_documents;
create policy settle_documents_delete_own on public.settle_documents
  for delete to authenticated using ((select auth.uid()) = user_id);

commit;
