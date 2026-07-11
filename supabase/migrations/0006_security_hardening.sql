-- 0006_security_hardening.sql
--
-- Closes two exploitable gaps found in a security review:
--
--  1. The XP / streak / daily-activity RPCs are SECURITY DEFINER (they bypass
--     RLS) yet trust a caller-supplied `p_user_id` and are EXECUTE-able by the
--     `anon` role. Anyone holding the public anon key (it ships to every
--     browser) could therefore forge XP, streaks and activity for ANY user:
--         POST /rest/v1/rpc/increment_xp { p_user_id: <victim>, p_amount: 1e9 }
--     Fix: pin search_path, force `p_user_id = auth.uid()` inside each function,
--     and revoke EXECUTE from anon/public so only signed-in callers reach them.
--
--  2. The `profiles` UPDATE policy is row-scoped but has no column protection,
--     so a signed-in user could `update({ role: 'admin' })` or set `xp_total`
--     directly on their own row. Fix: revoke UPDATE on the privileged columns
--     from `authenticated`/`anon`; they are only ever written by the DEFINER
--     functions above (which run as the table owner).

begin;

-- ── 1. Harden the mutating SECURITY DEFINER functions ────────────────────────

create or replace function public.increment_xp(p_user_id uuid, p_amount integer)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if p_user_id is distinct from auth.uid() then
    raise exception 'not authorised' using errcode = '42501';
  end if;
  -- Defensive bound: a single award is never legitimately huge.
  if p_amount is null or p_amount < 0 or p_amount > 10000 then
    raise exception 'invalid xp amount' using errcode = '22023';
  end if;
  update profiles set xp_total = xp_total + p_amount where id = p_user_id;
end;
$$;

create or replace function public.increment_streak(p_user_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Europe/Amsterdam')::date;
  v_profile profiles%rowtype;
begin
  if p_user_id is distinct from auth.uid() then
    raise exception 'not authorised' using errcode = '42501';
  end if;
  select * into v_profile from profiles where id = p_user_id;
  if v_profile.streak_last_date = v_today then return; end if;
  update profiles
  set streak_days = case when streak_last_date = v_today - 1 or streak_last_date is null
                         then streak_days + 1 else 1 end,
      streak_last_date = v_today
  where id = p_user_id;
end;
$$;

create or replace function public.check_and_update_streak(p_user_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_profile profiles%rowtype;
  v_today date := (now() at time zone 'Europe/Amsterdam')::date;
  v_gap_days integer;
begin
  if p_user_id is distinct from auth.uid() then
    raise exception 'not authorised' using errcode = '42501';
  end if;
  select * into v_profile from profiles where id = p_user_id;
  if v_profile.streak_last_date is null then return; end if;
  v_gap_days := v_today - v_profile.streak_last_date;
  if v_gap_days = 0 then return;
  elsif v_gap_days = 1 then return;
  elsif v_gap_days = 2 and v_profile.streak_freeze_available then
    update profiles set streak_freeze_available = false where id = p_user_id;
  else
    update profiles set streak_days = 0, streak_last_date = null where id = p_user_id;
  end if;
end;
$$;

create or replace function public.upsert_daily_activity(
  p_user_id uuid, p_date date, p_xp integer default 0, p_minutes integer default 0,
  p_lessons integer default 0, p_words integer default 0)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  if p_user_id is distinct from auth.uid() then
    raise exception 'not authorised' using errcode = '42501';
  end if;
  insert into daily_activity (user_id, date, xp_earned, minutes_spent, lessons_completed, words_reviewed)
  values (p_user_id, p_date, p_xp, p_minutes, p_lessons, p_words)
  on conflict (user_id, date) do update set
    xp_earned = daily_activity.xp_earned + excluded.xp_earned,
    minutes_spent = daily_activity.minutes_spent + excluded.minutes_spent,
    lessons_completed = daily_activity.lessons_completed + excluded.lessons_completed,
    words_reviewed = daily_activity.words_reviewed + excluded.words_reviewed;
end;
$$;

create or replace function public.get_writing_stats(p_user_id uuid)
  returns jsonb
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  total_completed int;
  avg_score numeric;
  by_type jsonb;
begin
  if p_user_id is distinct from auth.uid() then
    raise exception 'not authorised' using errcode = '42501';
  end if;
  select count(*), coalesce(avg(best_score), 0) into total_completed, avg_score
  from public.user_writing_progress where user_id = p_user_id and status = 'completed';
  select coalesce(jsonb_object_agg(t.task_type, t.c), '{}'::jsonb) into by_type
  from (
    select wt.task_type, count(*)::int as c
    from public.user_writing_progress uwp
    join public.writing_tasks wt on wt.id = uwp.task_id
    where uwp.user_id = p_user_id and uwp.status = 'completed'
    group by wt.task_type
  ) t;
  return jsonb_build_object(
    'total_completed', coalesce(total_completed, 0),
    'avg_score', round(coalesce(avg_score, 0))::int,
    'by_task_type', coalesce(by_type, '{}'::jsonb));
end;
$$;

-- handle_new_user is a trigger function on auth.users; it should never be
-- callable directly over the REST API.
alter function public.handle_new_user() set search_path = public;

-- ── 2. Lock down who can EXECUTE these functions ─────────────────────────────
-- Only signed-in users need them; anon never should.
revoke execute on function public.increment_xp(uuid, integer) from anon, public;
revoke execute on function public.increment_streak(uuid) from anon, public;
revoke execute on function public.check_and_update_streak(uuid) from anon, public;
revoke execute on function public.upsert_daily_activity(uuid, date, integer, integer, integer, integer) from anon, public;
revoke execute on function public.get_writing_stats(uuid) from anon, public;
revoke execute on function public.handle_new_user() from anon, authenticated, public;

grant execute on function public.increment_xp(uuid, integer) to authenticated, service_role;
grant execute on function public.increment_streak(uuid) to authenticated, service_role;
grant execute on function public.check_and_update_streak(uuid) to authenticated, service_role;
grant execute on function public.upsert_daily_activity(uuid, date, integer, integer, integer, integer) to authenticated, service_role;
grant execute on function public.get_writing_stats(uuid) to authenticated, service_role;

-- ── 3. Column-level protection on profiles ───────────────────────────────────
-- Users may edit preference columns (username, level, goals, exam dates, etc.)
-- but must never set role / xp / streak / counts directly — those are written
-- only by the DEFINER functions above. RLS is row-level and cannot express
-- this. A table-level UPDATE grant overrides column-level REVOKEs, so we drop
-- the whole-table privilege and re-grant UPDATE on the editable columns only.
revoke update on public.profiles from authenticated, anon;

grant update (
  username, avatar_url, current_level, daily_goal_minutes,
  exam_target_date, streak_freeze_available, leaderboard_opt_in,
  writing_exam_target_date, knm_exam_target_date, listening_exam_target_date,
  exam_completed, writing_exam_completed, knm_exam_completed, listening_exam_completed,
  b1_exam_target_date, b1_exam_completed,
  b1_writing_exam_target_date, b1_writing_exam_completed,
  b1_listening_exam_target_date, b1_listening_exam_completed
) on public.profiles to authenticated;

commit;
