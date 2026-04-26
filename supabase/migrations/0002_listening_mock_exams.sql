-- Listening A2 mock exams: 3 full-length practice exams with 5 sections × 4 MCQ each.

create table if not exists listening_exams (
  id bigserial primary key,
  level text not null default 'A2',
  slug text not null unique,
  title text not null,
  description text,
  total_questions integer not null,
  passing_score integer not null default 60,
  estimated_minutes integer not null default 30,
  position integer not null default 1,
  created_at timestamptz default now()
);

create table if not exists listening_exam_sections (
  id bigserial primary key,
  exam_id bigint not null references listening_exams(id) on delete cascade,
  position integer not null,
  task_type text not null check (task_type in ('announcement','phone_message','dialogue','radio_snippet','instructions')),
  title text not null,
  scenario_nl text,
  scenario_en text,
  transcript_nl text not null,
  transcript_en text,
  voice_config jsonb not null,
  audio_url text,
  audio_duration_seconds integer,
  questions jsonb not null,
  unique (exam_id, position)
);

create table if not exists user_listening_exam_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_id bigint not null references listening_exams(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  score integer,
  correct_count integer,
  total_questions integer,
  status text not null default 'draft' check (status in ('draft','completed')),
  passed boolean,
  time_spent_seconds integer,
  started_at timestamptz default now(),
  submitted_at timestamptz,
  updated_at timestamptz default now()
);

create index if not exists idx_user_listening_exam_submissions_user on user_listening_exam_submissions(user_id);

alter table listening_exams enable row level security;
alter table listening_exam_sections enable row level security;
alter table user_listening_exam_submissions enable row level security;

drop policy if exists "exams readable" on listening_exams;
create policy "exams readable" on listening_exams for select to authenticated using (true);

drop policy if exists "sections readable" on listening_exam_sections;
create policy "sections readable" on listening_exam_sections for select to authenticated using (true);

drop policy if exists "own exam submissions" on user_listening_exam_submissions;
create policy "own exam submissions" on user_listening_exam_submissions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
