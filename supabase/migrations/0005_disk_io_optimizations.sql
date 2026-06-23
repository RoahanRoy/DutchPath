-- Disk IO / performance optimizations based on Supabase performance advisor.
-- Applied to address "Disk IO Budget depletion" on the free-tier compute.
--
-- 1) Add covering indexes for unindexed foreign keys.
-- 2) Optimize RLS policies so auth.uid() is evaluated once per query
--    (init-plan) instead of once per row, removing the
--    `auth_rls_initplan` warnings.
-- 3) Drop an unused index to remove needless write amplification.

------------------------------------------------------------------
-- 1) Covering indexes for foreign keys
------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_lessons_unlock_after_lesson_id
  ON public.lessons (unlock_after_lesson_id);
CREATE INDEX IF NOT EXISTS idx_listening_tasks_unlock_after_task_id
  ON public.listening_tasks (unlock_after_task_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id
  ON public.user_achievements (achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson_id
  ON public.user_lesson_progress (lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_listening_exam_submissions_exam_id
  ON public.user_listening_exam_submissions (exam_id);
CREATE INDEX IF NOT EXISTS idx_user_listening_progress_task_id
  ON public.user_listening_progress (task_id);
CREATE INDEX IF NOT EXISTS idx_user_listening_submissions_task_id
  ON public.user_listening_submissions (task_id);
CREATE INDEX IF NOT EXISTS idx_user_vocabulary_card_id
  ON public.user_vocabulary (card_id);
CREATE INDEX IF NOT EXISTS idx_user_writing_exam_submissions_exam_id
  ON public.user_writing_exam_submissions (exam_id);
CREATE INDEX IF NOT EXISTS idx_user_writing_progress_task_id
  ON public.user_writing_progress (task_id);
CREATE INDEX IF NOT EXISTS idx_user_writing_submissions_task_id
  ON public.user_writing_submissions (task_id);
CREATE INDEX IF NOT EXISTS idx_writing_tasks_unlock_after_task_id
  ON public.writing_tasks (unlock_after_task_id);

------------------------------------------------------------------
-- 2) Drop unused index (flagged by advisor 0005_unused_index).
--    The (user_id, task_id) FK lookups are now served by the new
--    single-column task_id index above; (user_id, status) queries
--    keep uws_user_status_idx.
------------------------------------------------------------------
DROP INDEX IF EXISTS public.uws_user_task_idx;

------------------------------------------------------------------
-- 3) Re-create RLS policies wrapping auth.uid() in a scalar
--    sub-select so it is evaluated once per statement.
------------------------------------------------------------------

-- profiles
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING ((select auth.uid()) = id);
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT WITH CHECK ((select auth.uid()) = id);
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id);

-- daily_activity
DROP POLICY IF EXISTS da_select_own ON public.daily_activity;
CREATE POLICY da_select_own ON public.daily_activity
  FOR SELECT USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS da_insert_own ON public.daily_activity;
CREATE POLICY da_insert_own ON public.daily_activity
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS da_update_own ON public.daily_activity;
CREATE POLICY da_update_own ON public.daily_activity
  FOR UPDATE USING ((select auth.uid()) = user_id);

-- user_achievements
DROP POLICY IF EXISTS ua_select_own ON public.user_achievements;
CREATE POLICY ua_select_own ON public.user_achievements
  FOR SELECT USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS ua_insert_own ON public.user_achievements;
CREATE POLICY ua_insert_own ON public.user_achievements
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- user_lesson_progress
DROP POLICY IF EXISTS ulp_select_own ON public.user_lesson_progress;
CREATE POLICY ulp_select_own ON public.user_lesson_progress
  FOR SELECT USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS ulp_insert_own ON public.user_lesson_progress;
CREATE POLICY ulp_insert_own ON public.user_lesson_progress
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS ulp_update_own ON public.user_lesson_progress;
CREATE POLICY ulp_update_own ON public.user_lesson_progress
  FOR UPDATE USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS ulp_delete_own ON public.user_lesson_progress;
CREATE POLICY ulp_delete_own ON public.user_lesson_progress
  FOR DELETE USING ((select auth.uid()) = user_id);

-- user_vocabulary
DROP POLICY IF EXISTS uv_select_own ON public.user_vocabulary;
CREATE POLICY uv_select_own ON public.user_vocabulary
  FOR SELECT USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS uv_insert_own ON public.user_vocabulary;
CREATE POLICY uv_insert_own ON public.user_vocabulary
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS uv_update_own ON public.user_vocabulary;
CREATE POLICY uv_update_own ON public.user_vocabulary
  FOR UPDATE USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS uv_delete_own ON public.user_vocabulary;
CREATE POLICY uv_delete_own ON public.user_vocabulary
  FOR DELETE USING ((select auth.uid()) = user_id);

-- user_writing_progress
DROP POLICY IF EXISTS uwp_select_own ON public.user_writing_progress;
CREATE POLICY uwp_select_own ON public.user_writing_progress
  FOR SELECT USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS uwp_insert_own ON public.user_writing_progress;
CREATE POLICY uwp_insert_own ON public.user_writing_progress
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS uwp_update_own ON public.user_writing_progress;
CREATE POLICY uwp_update_own ON public.user_writing_progress
  FOR UPDATE USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS uwp_delete_own ON public.user_writing_progress;
CREATE POLICY uwp_delete_own ON public.user_writing_progress
  FOR DELETE USING ((select auth.uid()) = user_id);

-- user_writing_submissions
DROP POLICY IF EXISTS uws_select_own ON public.user_writing_submissions;
CREATE POLICY uws_select_own ON public.user_writing_submissions
  FOR SELECT USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS uws_insert_own ON public.user_writing_submissions;
CREATE POLICY uws_insert_own ON public.user_writing_submissions
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS uws_update_own ON public.user_writing_submissions;
CREATE POLICY uws_update_own ON public.user_writing_submissions
  FOR UPDATE USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS uws_delete_own ON public.user_writing_submissions;
CREATE POLICY uws_delete_own ON public.user_writing_submissions
  FOR DELETE USING ((select auth.uid()) = user_id);

-- user_listening_progress (authenticated role, ALL command)
DROP POLICY IF EXISTS "own progress" ON public.user_listening_progress;
CREATE POLICY "own progress" ON public.user_listening_progress
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- user_listening_submissions (authenticated role, ALL command)
DROP POLICY IF EXISTS "own submissions" ON public.user_listening_submissions;
CREATE POLICY "own submissions" ON public.user_listening_submissions
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- user_listening_exam_submissions (authenticated role, ALL command)
DROP POLICY IF EXISTS "own exam submissions" ON public.user_listening_exam_submissions;
CREATE POLICY "own exam submissions" ON public.user_listening_exam_submissions
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- user_writing_exam_submissions (authenticated role, ALL command)
DROP POLICY IF EXISTS "own writing exam submissions" ON public.user_writing_exam_submissions;
CREATE POLICY "own writing exam submissions" ON public.user_writing_exam_submissions
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));
