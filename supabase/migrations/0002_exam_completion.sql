-- Exam completion flags
-- Allows users to mark an exam as completed so it no longer appears
-- as an upcoming "to do" countdown on the dashboard.
-- Run in Supabase SQL editor.

alter table public.profiles
  add column if not exists exam_completed boolean not null default false,
  add column if not exists writing_exam_completed boolean not null default false,
  add column if not exists knm_exam_completed boolean not null default false,
  add column if not exists listening_exam_completed boolean not null default false;
