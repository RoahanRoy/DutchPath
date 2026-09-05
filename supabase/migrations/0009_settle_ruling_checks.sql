-- 0009_settle_ruling_checks.sql
--
-- A record of every completed 30% ruling eligibility check.
--
-- Design notes, following the conventions established in 0005/0006/0008:
--
--  1. `settle_` prefix in `public`, like the rest of the Settle track. PostgREST
--     only exposes schemas it is configured for, so a separate schema would be
--     invisible to the client.
--
--  2. Append-only by design: there is a SELECT, INSERT and DELETE policy but
--     deliberately NO UPDATE policy. A row records what the checker computed
--     under the figures in force on a given date; a row that can be edited
--     afterwards is not that record. Users can still delete their own rows.
--
--  3. No SECURITY DEFINER function, for the same reason as 0008: nothing here is
--     a privileged column, so a plain RLS-guarded table write is correct. The
--     RPC pattern in 0006/0007 exists to protect `profiles` counters.
--
--  4. Policies use the init-plan form `(select auth.uid())` from 0005. The bare
--     `auth.uid()` shape re-evaluates once per row and re-opens the
--     `auth_rls_initplan` advisor warning.
--
--  5. `answers` and `computed` are jsonb rather than columns: the question bank
--     and the result shape live in lib/settle/ruling-30.ts and change with the
--     tax year. Freezing them into columns would mean a migration every time a
--     question is added, and would lose the shape older rows were written with.
--
--  6. Nothing here awards XP, streaks or achievements. The Settle track is
--     deliberately not wired into the gamification tables.

begin;

create table if not exists public.settle_ruling_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- The RulingAnswers object exactly as the user answered it.
  answers jsonb not null default '{}'::jsonb,
  verdict text not null
    check (verdict in ('likely_eligible','likely_not_eligible','needs_advisor')),
  -- The RulingResult: reasons, salaryThresholdApplied, remainingMonths,
  -- taperBand, plus the VERIFIED_ON date the figures were checked on.
  computed jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Covering index for the user_id FK. 0005 added these across every table to cut
-- Disk IO on the free-tier compute; a new FK without one re-opens the
-- `unindexed_foreign_keys` advisor finding. Ordered by created_at desc because
-- the only read that matters is "this user's checks, newest first".
create index if not exists settle_ruling_checks_user_created_idx
  on public.settle_ruling_checks (user_id, created_at desc);

alter table public.settle_ruling_checks enable row level security;

drop policy if exists settle_ruling_checks_select_own on public.settle_ruling_checks;
create policy settle_ruling_checks_select_own on public.settle_ruling_checks
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists settle_ruling_checks_insert_own on public.settle_ruling_checks;
create policy settle_ruling_checks_insert_own on public.settle_ruling_checks
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- No UPDATE policy: see note 2.

drop policy if exists settle_ruling_checks_delete_own on public.settle_ruling_checks;
create policy settle_ruling_checks_delete_own on public.settle_ruling_checks
  for delete to authenticated using ((select auth.uid()) = user_id);

commit;
