export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// Row types
export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  current_level: "A2" | "B1" | "B2";
  xp_total: number;
  streak_days: number;
  streak_last_date: string | null;
  daily_goal_minutes: number;
  exam_target_date: string | null;
  streak_freeze_available: boolean;
  leaderboard_opt_in: boolean;
  role: "user" | "admin";
  created_at: string;
  writing_exam_target_date: string | null;
  writing_xp_total: number;
  writing_completed_count: number;
  knm_exam_target_date: string | null;
  listening_exam_target_date: string | null;
  listening_xp_total: number;
  listening_completed_count: number;
  exam_completed: boolean;
  writing_exam_completed: boolean;
  knm_exam_completed: boolean;
  listening_exam_completed: boolean;
  b1_exam_target_date: string | null;
  b1_exam_completed: boolean;
  b1_writing_exam_target_date: string | null;
  b1_writing_exam_completed: boolean;
  b1_listening_exam_target_date: string | null;
  b1_listening_exam_completed: boolean;
};

export type Lesson = {
  id: number;
  level: string;
  week: number;
  day: number;
  type: "reading" | "vocabulary" | "grammar" | "listening";
  title: string;
  source_label: string | null;
  content: Json;
  xp_reward: number;
  estimated_minutes: number;
  unlock_after_lesson_id: number | null;
};

export type UserLessonProgress = {
  user_id: string;
  lesson_id: number;
  status: "locked" | "available" | "in_progress" | "completed";
  score: number | null;
  attempts: number;
  time_spent_seconds: number;
  completed_at: string | null;
  last_attempt_at: string | null;
};

export type VocabCard = {
  id: number;
  level: string;
  category: "forms" | "everyday" | "time" | "people";
  dutch: string;
  english: string;
  example_sentence_nl: string | null;
  example_sentence_en: string | null;
  difficulty: number;
};

export type UserVocab = {
  user_id: string;
  card_id: number;
  status: "new" | "learning" | "reviewing" | "mastered";
  next_review_at: string;
  correct_count: number;
  incorrect_count: number;
  streak: number;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
};

export type DailyActivity = {
  user_id: string;
  date: string;
  xp_earned: number;
  minutes_spent: number;
  lessons_completed: number;
  words_reviewed: number;
};

export type Achievement = {
  id: number;
  key: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  condition_json: Json;
};

export type UserAchievement = {
  user_id: string;
  achievement_id: number;
  unlocked_at: string;
};

/* ── Writing (Schrijven) track ─────────────────────────────────── */

export type WritingTaskType =
  | "form"
  | "note"
  | "informal_email"
  | "formal_email"
  | "sentence_complete";

export type RequiredElement = {
  key: string;
  label_nl: string;
  label_en: string;
  hint?: string | null;
};

export type UsefulPhrase = {
  nl: string;
  en: string;
  when_to_use?: string | null;
};

export type WritingRubric = {
  task_completion?: { weight: number; criteria: string };
  structure?: { weight: number; criteria: string };
  vocabulary?: { weight: number; criteria: string };
  grammar?: { weight: number; criteria: string };
};

export type WritingTask = {
  id: number;
  level: string;
  week: number;
  day: number;
  task_type: WritingTaskType;
  title: string;
  scenario_nl: string;
  scenario_en: string | null;
  instructions_nl: string;
  required_elements: RequiredElement[];
  word_count_min: number | null;
  word_count_max: number | null;
  model_answer_nl: string;
  model_answer_notes: string | null;
  rubric: WritingRubric;
  useful_phrases: UsefulPhrase[] | null;
  xp_reward: number;
  estimated_minutes: number;
  unlock_after_task_id: number | null;
};

export type SelfScore = {
  task_completion: number;
  structure: number;
  vocabulary: number;
  grammar: number;
  total: number;
};

export type UserWritingSubmission = {
  id: string;
  user_id: string;
  task_id: number;
  submission_text: string;
  form_fields: Record<string, string> | null;
  word_count: number | null;
  time_spent_seconds: number | null;
  status: "draft" | "submitted" | "self_graded" | "completed";
  self_score: SelfScore | null;
  checklist_results: Record<string, boolean> | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UserWritingProgress = {
  user_id: string;
  task_id: number;
  status: "locked" | "available" | "in_progress" | "completed";
  best_score: number | null;
  attempts: number;
  last_attempt_at: string | null;
  completed_at: string | null;
};

export type WritingExam = {
  id: number;
  level: string;
  slug: string;
  title: string;
  description: string | null;
  total_sections: number;
  passing_score: number;
  estimated_minutes: number;
  position: number;
  created_at: string;
};

export type WritingExamSection = {
  id: number;
  exam_id: number;
  position: number;
  task_type: WritingTaskType;
  title: string;
  scenario_nl: string;
  scenario_en: string | null;
  instructions_nl: string;
  required_elements: RequiredElement[];
  word_count_min: number | null;
  word_count_max: number | null;
  model_answer_nl: string;
  model_answer_notes: string | null;
  useful_phrases: UsefulPhrase[] | null;
};

export type WritingExamAnswer = {
  text: string;
  form_fields?: Record<string, string> | null;
  word_count: number;
  self_score: SelfScore;
};

export type UserWritingExamSubmission = {
  id: string;
  user_id: string;
  exam_id: number;
  answers: Record<string, WritingExamAnswer>; // keyed by section id (string)
  score: number | null;
  total_points: number | null;
  max_points: number | null;
  status: "draft" | "completed";
  passed: boolean | null;
  time_spent_seconds: number | null;
  started_at: string;
  submitted_at: string | null;
  updated_at: string;
};

export type WritingPhraseCategory =
  | "greeting_formal"
  | "greeting_informal"
  | "closing_formal"
  | "closing_informal"
  | "connector"
  | "request"
  | "complaint"
  | "apology"
  | "invitation"
  | "thanks";

export type WritingPhrase = {
  id: number;
  category: WritingPhraseCategory;
  phrase_nl: string;
  phrase_en: string;
  example_nl: string | null;
  formality: "formal" | "informal" | "both";
};

/* ── Listening (Luisteren) track ───────────────────────────────── */

export type ListeningTaskType =
  | "announcement"
  | "phone_message"
  | "dialogue"
  | "radio_snippet"
  | "instructions";

export type ListeningVoiceTurn = {
  speaker: string;
  voice: string;
  text: string;
  speakingRate?: number;
  pitch?: number;
  pauseAfterMs?: number;
};

export type ListeningVoiceConfig =
  | { mode: "single"; voice: string; speakingRate?: number; pitch?: number }
  | { mode: "dialogue"; turns: ListeningVoiceTurn[] };

export type ListeningQuestion = {
  id: string;
  prompt_nl: string;
  prompt_en: string;
  options: { id: string; text_nl: string; text_en: string }[];
  correct_option_id: string;
  explanation_nl: string;
};

export type ListeningTask = {
  id: number;
  level: string;
  week: number;
  day: number;
  task_type: ListeningTaskType;
  title: string;
  scenario_nl: string;
  scenario_en: string | null;
  transcript_nl: string;
  transcript_en: string | null;
  audio_url: string | null;
  audio_duration_seconds: number | null;
  voice_config: ListeningVoiceConfig;
  questions: ListeningQuestion[];
  xp_reward: number;
  estimated_minutes: number;
  allow_replays: number;
  unlock_after_task_id: number | null;
};

export type UserListeningSubmission = {
  id: string;
  user_id: string;
  task_id: number;
  answers: Record<string, string>;
  score: number | null;
  correct_count: number | null;
  total_questions: number | null;
  replays_used: number;
  time_spent_seconds: number | null;
  status: "draft" | "submitted" | "completed";
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UserListeningProgress = {
  user_id: string;
  task_id: number;
  status: "locked" | "available" | "in_progress" | "completed";
  best_score: number | null;
  attempts: number;
  last_attempt_at: string | null;
  completed_at: string | null;
};

export type ListeningExam = {
  id: number;
  level: string;
  slug: string;
  title: string;
  description: string | null;
  total_questions: number;
  passing_score: number;
  estimated_minutes: number;
  position: number;
  created_at: string;
};

export type ListeningExamSection = {
  id: number;
  exam_id: number;
  position: number;
  task_type: ListeningTaskType;
  title: string;
  scenario_nl: string | null;
  scenario_en: string | null;
  transcript_nl: string;
  transcript_en: string | null;
  voice_config: ListeningVoiceConfig;
  audio_url: string | null;
  audio_duration_seconds: number | null;
  questions: ListeningQuestion[];
};

export type UserListeningExamSubmission = {
  id: string;
  user_id: string;
  exam_id: number;
  answers: Record<string, string>; // keyed by `${section_id}:${question_id}`
  score: number | null;
  correct_count: number | null;
  total_questions: number | null;
  status: "draft" | "completed";
  passed: boolean | null;
  time_spent_seconds: number | null;
  started_at: string;
  submitted_at: string | null;
  updated_at: string;
};

/* ── Settle track (Expat OS) ───────────────────────────────────── */

export type SettleCategory =
  | "arrival"
  | "money"
  | "health"
  | "mobility"
  | "housing"
  | "status";

export type SettleOffsetFrom =
  | "arrival"
  | "permit_start"
  | "registration"
  | "fixed_date";

export type SettleSeverity = "blocking" | "costly" | "routine";

export type SettleTimelineStatus =
  | "upcoming"
  | "due"
  | "done"
  | "skipped"
  | "not_applicable";

/**
 * One predicate inside a rule's `trigger_conditions`. A bare value means
 * equality; `{ in: [...] }` means membership. Conditions are AND-ed.
 */
export type SettleTriggerPredicate =
  | string
  | number
  | boolean
  | null
  | { in: (string | number | boolean)[] };

/** Keyed by `SettleProfile` field name. An empty object applies to everyone. */
export type SettleTriggerConditions = Record<string, SettleTriggerPredicate>;

export type SettleRule = {
  id: number;
  key: string;
  category: SettleCategory;
  title_en: string;
  summary_en: string;
  body_en: string;
  official_url: string | null;
  trigger_conditions: SettleTriggerConditions;
  offset_days: number | null;
  offset_from: SettleOffsetFrom | null;
  fixed_date: string | null;
  severity: SettleSeverity;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
};

export type SettleProfile = {
  user_id: string;
  arrival_date: string | null;
  permit_type: string | null;
  nationality_group: string | null;
  employer_type: string | null;
  has_30_percent_ruling: boolean;
  has_bsn: boolean;
  has_digid: boolean;
  created_at: string;
  updated_at: string;
};

export type SettleTimelineItem = {
  id: number;
  user_id: string;
  rule_key: string;
  due_date: string | null;
  status: SettleTimelineStatus;
  completed_at: string | null;
  created_at: string;
};

export type SettleDocument = {
  id: string;
  user_id: string;
  rule_key: string | null;
  label: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

/**
 * A marketing-surface email capture. Deliberately not joined to auth.users: a
 * lead is a visitor who has not signed up, so there is no user_id to hang it on.
 *
 * The table is write-only from the client (migration 0010): RLS is on and only
 * an INSERT policy exists, so nothing here can be read back with the anon or
 * authenticated key. This type describes the row for completeness and for the
 * service-role export path -- no client code should ever select it.
 */
export type Lead = {
  id: string;
  email: string;
  /** Which surface captured it: "landing", "guide:<slug>". */
  source: string;
  created_at: string;
};

export type SettleRulingVerdict =
  | "likely_eligible"
  | "likely_not_eligible"
  | "needs_advisor";

/**
 * One completed 30% ruling eligibility check. Append-only — the migration grants
 * no UPDATE policy, because a row records what was computed under the figures in
 * force on a given date. `answers` holds the RulingAnswers object and `computed`
 * the RulingResult; both are jsonb because their shape follows the tax year, and
 * both live in lib/settle/ruling-30.ts.
 */
export type SettleRulingCheck = {
  id: string;
  user_id: string;
  answers: Json;
  verdict: SettleRulingVerdict;
  computed: Json;
  created_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: { id: string; username?: string | null; avatar_url?: string | null; current_level?: string; xp_total?: number; streak_days?: number; streak_last_date?: string | null; daily_goal_minutes?: number; exam_target_date?: string | null; streak_freeze_available?: boolean; leaderboard_opt_in?: boolean; role?: string; created_at?: string; writing_exam_target_date?: string | null; writing_xp_total?: number; writing_completed_count?: number; knm_exam_target_date?: string | null; listening_exam_target_date?: string | null; listening_xp_total?: number; listening_completed_count?: number; exam_completed?: boolean; writing_exam_completed?: boolean; knm_exam_completed?: boolean; listening_exam_completed?: boolean; b1_exam_target_date?: string | null; b1_exam_completed?: boolean; b1_writing_exam_target_date?: string | null; b1_writing_exam_completed?: boolean; b1_listening_exam_target_date?: string | null; b1_listening_exam_completed?: boolean };
        Update: { id?: string; username?: string | null; avatar_url?: string | null; current_level?: string; xp_total?: number; streak_days?: number; streak_last_date?: string | null; daily_goal_minutes?: number; exam_target_date?: string | null; streak_freeze_available?: boolean; leaderboard_opt_in?: boolean; role?: string; created_at?: string; writing_exam_target_date?: string | null; writing_xp_total?: number; writing_completed_count?: number; knm_exam_target_date?: string | null; listening_exam_target_date?: string | null; listening_xp_total?: number; listening_completed_count?: number; exam_completed?: boolean; writing_exam_completed?: boolean; knm_exam_completed?: boolean; listening_exam_completed?: boolean; b1_exam_target_date?: string | null; b1_exam_completed?: boolean; b1_writing_exam_target_date?: string | null; b1_writing_exam_completed?: boolean; b1_listening_exam_target_date?: string | null; b1_listening_exam_completed?: boolean };
      };
      lessons: {
        Row: Lesson;
        Insert: { level: string; week: number; day: number; type: string; title: string; source_label?: string | null; content?: Json; xp_reward?: number; estimated_minutes?: number; unlock_after_lesson_id?: number | null };
        Update: { id?: number; level?: string; week?: number; day?: number; type?: string; title?: string; source_label?: string | null; content?: Json; xp_reward?: number; estimated_minutes?: number; unlock_after_lesson_id?: number | null };
      };
      user_lesson_progress: {
        Row: UserLessonProgress;
        Insert: { user_id: string; lesson_id: number; status?: string; score?: number | null; attempts?: number; time_spent_seconds?: number; completed_at?: string | null; last_attempt_at?: string | null };
        Update: { user_id?: string; lesson_id?: number; status?: string; score?: number | null; attempts?: number; time_spent_seconds?: number; completed_at?: string | null; last_attempt_at?: string | null };
      };
      vocabulary_cards: {
        Row: VocabCard;
        Insert: { level: string; category: string; dutch: string; english: string; example_sentence_nl?: string | null; example_sentence_en?: string | null; difficulty?: number };
        Update: { id?: number; level?: string; category?: string; dutch?: string; english?: string; example_sentence_nl?: string | null; example_sentence_en?: string | null; difficulty?: number };
      };
      user_vocabulary: {
        Row: UserVocab;
        Insert: { user_id: string; card_id: number; status?: string; next_review_at?: string; correct_count?: number; incorrect_count?: number; streak?: number; ease_factor?: number; interval_days?: number; repetitions?: number };
        Update: { user_id?: string; card_id?: number; status?: string; next_review_at?: string; correct_count?: number; incorrect_count?: number; streak?: number; ease_factor?: number; interval_days?: number; repetitions?: number };
      };
      daily_activity: {
        Row: DailyActivity;
        Insert: { user_id: string; date: string; xp_earned?: number; minutes_spent?: number; lessons_completed?: number; words_reviewed?: number };
        Update: { user_id?: string; date?: string; xp_earned?: number; minutes_spent?: number; lessons_completed?: number; words_reviewed?: number };
      };
      achievements: {
        Row: Achievement;
        Insert: { key: string; title: string; description: string; icon: string; xp_reward?: number; condition_json?: Json };
        Update: { id?: number; key?: string; title?: string; description?: string; icon?: string; xp_reward?: number; condition_json?: Json };
      };
      user_achievements: {
        Row: UserAchievement;
        Insert: { user_id: string; achievement_id: number; unlocked_at?: string };
        Update: { user_id?: string; achievement_id?: number; unlocked_at?: string };
      };
      writing_tasks: {
        Row: WritingTask;
        Insert: { level?: string; week: number; day: number; task_type: string; title: string; scenario_nl: string; scenario_en?: string | null; instructions_nl: string; required_elements?: Json; word_count_min?: number | null; word_count_max?: number | null; model_answer_nl: string; model_answer_notes?: string | null; rubric?: Json; useful_phrases?: Json; xp_reward?: number; estimated_minutes?: number; unlock_after_task_id?: number | null };
        Update: { id?: number; level?: string; week?: number; day?: number; task_type?: string; title?: string; scenario_nl?: string; scenario_en?: string | null; instructions_nl?: string; required_elements?: Json; word_count_min?: number | null; word_count_max?: number | null; model_answer_nl?: string; model_answer_notes?: string | null; rubric?: Json; useful_phrases?: Json; xp_reward?: number; estimated_minutes?: number; unlock_after_task_id?: number | null };
      };
      user_writing_submissions: {
        Row: UserWritingSubmission;
        Insert: { id?: string; user_id: string; task_id: number; submission_text?: string; form_fields?: Json | null; word_count?: number | null; time_spent_seconds?: number | null; status?: string; self_score?: Json | null; checklist_results?: Json | null; submitted_at?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; user_id?: string; task_id?: number; submission_text?: string; form_fields?: Json | null; word_count?: number | null; time_spent_seconds?: number | null; status?: string; self_score?: Json | null; checklist_results?: Json | null; submitted_at?: string | null; created_at?: string; updated_at?: string };
      };
      user_writing_progress: {
        Row: UserWritingProgress;
        Insert: { user_id: string; task_id: number; status?: string; best_score?: number | null; attempts?: number; last_attempt_at?: string | null; completed_at?: string | null };
        Update: { user_id?: string; task_id?: number; status?: string; best_score?: number | null; attempts?: number; last_attempt_at?: string | null; completed_at?: string | null };
      };
      writing_phrases: {
        Row: WritingPhrase;
        Insert: { category: string; phrase_nl: string; phrase_en: string; example_nl?: string | null; formality: string };
        Update: { id?: number; category?: string; phrase_nl?: string; phrase_en?: string; example_nl?: string | null; formality?: string };
      };
      listening_tasks: {
        Row: ListeningTask;
        Insert: { level?: string; week: number; day: number; task_type: string; title: string; scenario_nl: string; scenario_en?: string | null; transcript_nl: string; transcript_en?: string | null; audio_url?: string | null; audio_duration_seconds?: number | null; voice_config: Json; questions: Json; xp_reward?: number; estimated_minutes?: number; allow_replays?: number; unlock_after_task_id?: number | null };
        Update: { id?: number; level?: string; week?: number; day?: number; task_type?: string; title?: string; scenario_nl?: string; scenario_en?: string | null; transcript_nl?: string; transcript_en?: string | null; audio_url?: string | null; audio_duration_seconds?: number | null; voice_config?: Json; questions?: Json; xp_reward?: number; estimated_minutes?: number; allow_replays?: number; unlock_after_task_id?: number | null };
      };
      user_listening_submissions: {
        Row: UserListeningSubmission;
        Insert: { id?: string; user_id: string; task_id: number; answers?: Json; score?: number | null; correct_count?: number | null; total_questions?: number | null; replays_used?: number; time_spent_seconds?: number | null; status?: string; submitted_at?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; user_id?: string; task_id?: number; answers?: Json; score?: number | null; correct_count?: number | null; total_questions?: number | null; replays_used?: number; time_spent_seconds?: number | null; status?: string; submitted_at?: string | null; created_at?: string; updated_at?: string };
      };
      user_listening_progress: {
        Row: UserListeningProgress;
        Insert: { user_id: string; task_id: number; status?: string; best_score?: number | null; attempts?: number; last_attempt_at?: string | null; completed_at?: string | null };
        Update: { user_id?: string; task_id?: number; status?: string; best_score?: number | null; attempts?: number; last_attempt_at?: string | null; completed_at?: string | null };
      };
      settle_rules: {
        Row: SettleRule;
        Insert: { key: string; category: string; title_en: string; summary_en: string; body_en: string; official_url?: string | null; trigger_conditions?: Json; offset_days?: number | null; offset_from?: string | null; fixed_date?: string | null; severity: string; effective_from: string; effective_to?: string | null; created_at?: string };
        Update: { id?: number; key?: string; category?: string; title_en?: string; summary_en?: string; body_en?: string; official_url?: string | null; trigger_conditions?: Json; offset_days?: number | null; offset_from?: string | null; fixed_date?: string | null; severity?: string; effective_from?: string; effective_to?: string | null; created_at?: string };
      };
      settle_profile: {
        Row: SettleProfile;
        Insert: { user_id: string; arrival_date?: string | null; permit_type?: string | null; nationality_group?: string | null; employer_type?: string | null; has_30_percent_ruling?: boolean; has_bsn?: boolean; has_digid?: boolean; created_at?: string; updated_at?: string };
        Update: { user_id?: string; arrival_date?: string | null; permit_type?: string | null; nationality_group?: string | null; employer_type?: string | null; has_30_percent_ruling?: boolean; has_bsn?: boolean; has_digid?: boolean; created_at?: string; updated_at?: string };
      };
      settle_timeline_items: {
        Row: SettleTimelineItem;
        Insert: { user_id: string; rule_key: string; due_date?: string | null; status?: string; completed_at?: string | null; created_at?: string };
        Update: { id?: number; user_id?: string; rule_key?: string; due_date?: string | null; status?: string; completed_at?: string | null; created_at?: string };
      };
      settle_documents: {
        Row: SettleDocument;
        Insert: { id?: string; user_id: string; rule_key?: string | null; label: string; storage_path: string; mime_type?: string | null; size_bytes?: number | null; created_at?: string };
        Update: { id?: string; user_id?: string; rule_key?: string | null; label?: string; storage_path?: string; mime_type?: string | null; size_bytes?: number | null; created_at?: string };
      };
      leads: {
        // Insert-only: see migration 0010. There is no SELECT policy, so reads
        // return nothing; the Row/Update shapes are here to keep the schema
        // complete, not because anything queries them.
        Row: Lead;
        Insert: { id?: string; email: string; source?: string; created_at?: string };
        Update: { id?: string; email?: string; source?: string; created_at?: string };
      };
      settle_ruling_checks: {
        Row: SettleRulingCheck;
        Insert: { id?: string; user_id: string; answers?: Json; verdict: string; computed?: Json; created_at?: string };
        // No UPDATE policy exists on this table (0009); the type is here only so
        // the schema shape stays complete.
        Update: { id?: string; user_id?: string; answers?: Json; verdict?: string; computed?: Json; created_at?: string };
      };
    };
  };
}

export type LessonContent = {
  passage: { text: string; source_label: string };
  questions: Question[];
  vocabulary_ids: number[];
};

export type Question =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | FillBlankQuestion
  | VocabMatchQuestion
  | ReadingCompQuestion;

export type MultipleChoiceQuestion = {
  type: "multiple_choice";
  prompt: string;
  options: string[];
  correct_index: number;
  explanation: string;
  highlighted_word?: string;
};

export type TrueFalseQuestion = {
  type: "true_false";
  prompt: string;
  correct_answer: boolean;
  explanation: string;
  highlighted_word?: string;
};

export type FillBlankQuestion = {
  type: "fill_blank";
  prompt: string;
  word_bank: string[];
  correct_words: string[];
  explanation: string;
  highlighted_word?: string;
};

export type VocabMatchQuestion = {
  type: "vocab_match";
  prompt: string;
  pairs: { dutch: string; english: string }[];
  explanation: string;
};

export type ReadingCompQuestion = {
  type: "reading_comp";
  prompt: string;
  options: string[];
  correct_index: number;
  explanation: string;
};
