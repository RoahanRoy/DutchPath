-- Writing A2 mock exams: 3 full-length practice exams with 4 sections each
-- (form, note/short message, informal email, formal email).

create table if not exists writing_exams (
  id bigserial primary key,
  level text not null default 'A2',
  slug text not null unique,
  title text not null,
  description text,
  total_sections integer not null,
  passing_score integer not null default 60,
  estimated_minutes integer not null default 45,
  position integer not null default 1,
  created_at timestamptz default now()
);

create table if not exists writing_exam_sections (
  id bigserial primary key,
  exam_id bigint not null references writing_exams(id) on delete cascade,
  position integer not null,
  task_type text not null check (task_type in ('form','note','informal_email','formal_email','sentence_complete')),
  title text not null,
  scenario_nl text not null,
  scenario_en text,
  instructions_nl text not null,
  required_elements jsonb not null default '[]'::jsonb,
  word_count_min integer,
  word_count_max integer,
  model_answer_nl text not null,
  model_answer_notes text,
  useful_phrases jsonb,
  unique (exam_id, position)
);

create table if not exists user_writing_exam_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_id bigint not null references writing_exams(id) on delete cascade,
  -- answers: { "<section_id>": { "text": "...", "form_fields": {...}, "word_count": n, "self_score": {tc,st,vo,gr,total} } }
  answers jsonb not null default '{}'::jsonb,
  score integer,
  total_points integer,
  max_points integer,
  status text not null default 'draft' check (status in ('draft','completed')),
  passed boolean,
  time_spent_seconds integer,
  started_at timestamptz default now(),
  submitted_at timestamptz,
  updated_at timestamptz default now()
);

create index if not exists idx_user_writing_exam_submissions_user on user_writing_exam_submissions(user_id);

alter table writing_exams enable row level security;
alter table writing_exam_sections enable row level security;
alter table user_writing_exam_submissions enable row level security;

drop policy if exists "writing exams readable" on writing_exams;
create policy "writing exams readable" on writing_exams for select to authenticated using (true);

drop policy if exists "writing exam sections readable" on writing_exam_sections;
create policy "writing exam sections readable" on writing_exam_sections for select to authenticated using (true);

drop policy if exists "own writing exam submissions" on user_writing_exam_submissions;
create policy "own writing exam submissions" on user_writing_exam_submissions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
