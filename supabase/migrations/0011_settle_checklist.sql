-- 0011_settle_checklist.sql
--
-- Step-level guidance for the arrival stack: what to bring, how to book, what
-- happens next. Turns each settle_rules row from a deadline into a checklist.
--
--  1. `settle_rule_steps` is immutable reference content, exactly like
--     settle_rules: seeded with the service-role key, read through the cached
--     reader in lib/settle/rules.ts, superseded by inserting a new row and
--     closing the old one's `effective_to`. `rule_key` carries NO foreign key
--     for the same reason as settle_timeline_items.rule_key (0008, note 3): a
--     rule being superseded must not cascade away its steps' history.
--
--  2. `settle_rules.depends_on` is structural metadata — which step logically
--     comes first — not a change to regulatory content. It is backfilled in
--     place here rather than by superseding rows, because ordering does not
--     alter what the rule requires or when. The UI uses it for a soft "do X
--     first" hint only; it never blocks a user from marking anything done.
--
--  3. `settle_timeline_items.completed_steps` holds the step keys a user has
--     ticked. The existing owner-only UPDATE policy from 0008 already covers
--     the new column, so no policy changes are needed for it.

begin;

-- ── 1. settle_rule_steps — immutable reference content ──────────────────────

create table if not exists public.settle_rule_steps (
  id bigserial primary key,
  key text not null unique,
  rule_key text not null,
  position smallint not null,
  title_en text not null,
  body_en text not null,
  bring_en text[] not null default '{}',
  official_url text,
  effective_from date not null,
  effective_to date,
  created_at timestamptz not null default now()
);

create index if not exists settle_rule_steps_rule_position_idx
  on public.settle_rule_steps (rule_key, position);

alter table public.settle_rule_steps enable row level security;

-- Readable by any signed-in user, writable by no one — mirrors settle_rules.
-- The public checklist page reads through the service-role cached reader, so
-- anon needs no grant here.
drop policy if exists settle_rule_steps_select_authenticated on public.settle_rule_steps;
create policy settle_rule_steps_select_authenticated on public.settle_rule_steps
  for select to authenticated using (true);

-- ── 2. settle_rules.depends_on — structural ordering ────────────────────────

alter table public.settle_rules
  add column if not exists depends_on text[] not null default '{}';

update public.settle_rules set depends_on = array['brp_registration']
  where key = 'bsn_issuance' and depends_on = '{}';
update public.settle_rules set depends_on = array['bsn_issuance']
  where key in ('digid_activation', 'bank_account_opening', 'zorgverzekering_enrolment')
    and depends_on = '{}';
update public.settle_rules set depends_on = array['brp_registration']
  where key = 'huisarts_registration' and depends_on = '{}';

-- ── 3. settle_timeline_items.completed_steps — user state ───────────────────

alter table public.settle_timeline_items
  add column if not exists completed_steps text[] not null default '{}';

commit;
