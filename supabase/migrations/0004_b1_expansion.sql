-- B1 expansion (Staatsexamen NT2 Programma I)
-- The existing schema is already level-aware: `lessons.level`,
-- `vocabulary_cards.level`, `listening_tasks.level`, `writing_tasks.level`,
-- `listening_exams.level`, `writing_exams.level` all exist with default 'A2'.
-- B1 content is purely additive — we seed rows with level='B1'.
--
-- This migration adds helpful composite indexes/uniques so seed scripts can
-- idempotently upsert by (level, week, day) / (level, slug).

create unique index if not exists listening_tasks_level_week_day_uniq
  on public.listening_tasks (level, week, day);

create unique index if not exists writing_tasks_level_week_day_uniq
  on public.writing_tasks (level, week, day);

-- listening_exams / writing_exams already have unique(slug); slugs include the
-- level prefix (e.g. 'b1-mock-1'), so they're naturally level-disambiguated.

-- Per-level XP / completion counters on profiles. Existing counters remain
-- unified across levels (xp_total / streak_days etc. are global); these new
-- columns let the dashboard / profile show level-specific accuracy & exam
-- targets without colliding with A2 progress.
alter table public.profiles
  add column if not exists b1_exam_target_date date,
  add column if not exists b1_exam_completed boolean not null default false,
  add column if not exists b1_writing_exam_target_date date,
  add column if not exists b1_writing_exam_completed boolean not null default false,
  add column if not exists b1_listening_exam_target_date date,
  add column if not exists b1_listening_exam_completed boolean not null default false;
