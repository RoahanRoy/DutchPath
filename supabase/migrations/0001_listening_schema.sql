-- Listening (Luisteren) track schema
-- Mirrors user_writing_* shape. Run in Supabase SQL editor.

-- 1. Profile extensions
alter table public.profiles
  add column if not exists listening_exam_target_date date,
  add column if not exists listening_xp_total integer not null default 0,
  add column if not exists listening_completed_count integer not null default 0;

-- 2. listening_tasks
create table if not exists public.listening_tasks (
  id bigserial primary key,
  level text not null default 'A2',
  week integer not null,
  day integer not null,
  task_type text not null check (task_type in ('announcement','phone_message','dialogue','radio_snippet','instructions')),
  title text not null,
  scenario_nl text not null,
  scenario_en text,
  transcript_nl text not null,
  transcript_en text,
  audio_url text,
  audio_duration_seconds integer,
  voice_config jsonb not null,
  questions jsonb not null default '[]'::jsonb,
  xp_reward integer not null default 20,
  estimated_minutes integer not null default 6,
  allow_replays integer not null default 2,
  unlock_after_task_id bigint references public.listening_tasks(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists listening_tasks_level_day_idx
  on public.listening_tasks (level, week, day);

-- 3. user_listening_submissions
create table if not exists public.user_listening_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id bigint not null references public.listening_tasks(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  score integer,
  correct_count integer,
  total_questions integer,
  replays_used integer not null default 0,
  time_spent_seconds integer,
  status text not null default 'draft' check (status in ('draft','submitted','completed')),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_listening_submissions_user_task_idx
  on public.user_listening_submissions (user_id, task_id);

-- 4. user_listening_progress
create table if not exists public.user_listening_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id bigint not null references public.listening_tasks(id) on delete cascade,
  status text not null default 'locked' check (status in ('locked','available','in_progress','completed')),
  best_score integer,
  attempts integer not null default 0,
  last_attempt_at timestamptz,
  completed_at timestamptz,
  primary key (user_id, task_id)
);

-- 5. RLS
alter table public.listening_tasks enable row level security;
alter table public.user_listening_submissions enable row level security;
alter table public.user_listening_progress enable row level security;

drop policy if exists "listening_tasks readable by authenticated" on public.listening_tasks;
create policy "listening_tasks readable by authenticated"
  on public.listening_tasks for select
  to authenticated using (true);

drop policy if exists "own submissions" on public.user_listening_submissions;
create policy "own submissions"
  on public.user_listening_submissions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own progress" on public.user_listening_progress;
create policy "own progress"
  on public.user_listening_progress for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6. Storage bucket for audio (public read)
insert into storage.buckets (id, name, public)
values ('listening-audio', 'listening-audio', true)
on conflict (id) do update set public = true;

drop policy if exists "listening-audio public read" on storage.objects;
create policy "listening-audio public read"
  on storage.objects for select
  to public
  using (bucket_id = 'listening-audio');

-- service_role already bypasses RLS for uploads from the generation script.
