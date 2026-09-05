# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

DutchPath is a Duolingo-style learning platform for the Dutch **Inburgering** / **Staatsexamen NT2** exams, at **A2** and **B1** levels. Next.js 16 App Router + React 19 on Vercel, Supabase (Postgres + Auth + Storage) as the entire backend. There is no API layer of our own — client components talk to PostgREST directly, and privileged mutations go through `SECURITY DEFINER` RPCs.

## Commands

```bash
npm run dev            # dev server
npm run build          # production build — the only real typecheck (tsconfig is noEmit)
npm run lint           # eslint (flat config, next/core-web-vitals + next/typescript)
npx tsc --noEmit       # typecheck without a full build
```

There is **no test runner** in this project. Verification is `npm run build` + `npm run lint` + manually exercising the affected track.

`npm run lint` is **not clean on `main`** — it reports ~51 pre-existing problems, overwhelmingly `@typescript-eslint/no-explicit-any` (the Supabase generated types are routinely cast through `as any` at write sites) plus a few React Compiler `react-hooks/*` findings. Compare against the baseline rather than assuming a fresh error is yours.

### Content seeding

Seed scripts write reference content with the **service-role key** and are run manually, never at build/deploy time. They do **not** load `.env.local` themselves — inject env explicitly:

```bash
node --env-file=.env.local --import tsx scripts/seed-b1-lessons.ts
GOOGLE_APPLICATION_CREDENTIALS=./gcp-key.json \
  node --env-file=.env.local --import tsx scripts/generate-listening-audio.ts [--force]
```

`npm run seed:*` / `npm run generate:*` are the same scripts via `tsx`, but only work if the env vars are already exported. Audio generation additionally needs `ffmpeg`/`ffprobe` on PATH (`brew install ffmpeg`); it discovers Homebrew paths itself, or honours `FFMPEG_PATH`/`FFPROBE_PATH`.

Env vars in use: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server/scripts only), `GOOGLE_APPLICATION_CREDENTIALS`.

Migrations in `supabase/migrations/` are applied via the Supabase MCP tools or dashboard — there is no local Supabase CLI stack.

## Architecture

### Auth and the request hot path

This is the most load-bearing convention in the codebase, and it was arrived at to fix real timeouts and pool exhaustion. Do not undo it.

- [proxy.ts](proxy.ts) is Next 16's renamed middleware. It is the **only** place that refreshes the session cookie, does so best-effort with a 2s timeout, and skips router-prefetch requests. It never enforces auth.
- Pages authenticate with `getClaims()` / `getProfile()` from [lib/supabase/server.ts](lib/supabase/server.ts), which verify the JWT **locally** (ES256) — no round-trip to the Auth server. `getUser()` exists but is the slow path; prefer the other two.
- All three are wrapped in React `cache()`, so the `(app)` layout and the page share one fetch per request.
- Every page fans its queries out in a single `Promise.all` wave rather than awaiting serially. Follow this when adding queries.
- The profile is fetched server-side and pushed into the Zustand store by [components/profile-hydrator.tsx](components/profile-hydrator.tsx). Client components read `useAppStore(s => s.profile)`; they must not re-fetch it.

### Reference content is cached, user progress is not

[lib/supabase/reference.ts](lib/supabase/reference.ts) reads the immutable per-level tables (`lessons`, `vocabulary_cards`, `writing_tasks`, `listening_tasks`) through `unstable_cache` with a 1-hour revalidate. Because a cache scope cannot read `cookies()`, it uses the **service-role key** and bypasses RLS — safe only because these are fixed SELECTs on non-sensitive shared content, in a server-only module. Never import it from a client component, and never widen it to user-scoped tables.

The pattern in every track page: fetch cached reference content + the user's own progress rows in parallel, merge in the server component, hand a merged array to the `*-client.tsx`.

### Writes go through RPCs, not table updates

Migration `0006_security_hardening.sql` revoked table-wide UPDATE on `profiles` and pinned every `SECURITY DEFINER` function to `p_user_id = auth.uid()` with bounded amounts. Consequences for any new code:

- XP, streaks and daily activity: `increment_xp`, `increment_streak`, `check_and_update_streak`, `upsert_daily_activity`.
- Per-track counters (`writing_xp_total`, `listening_completed_count`, …): `increment_track_stats` (added in `0007` precisely because direct updates started failing silently).
- Direct `.update()` on `profiles` is only granted for user-editable preference columns (username, level, goals, exam dates, completion flags). A direct write to `role`/`xp_total`/counters **will fail**, and unchecked errors here are how the counters broke before.

The completion flow is duplicated across [lesson-player.tsx](app/(app)/lessons/[id]/lesson-player.tsx), [writing-editor.tsx](app/(app)/writing/[id]/writing-editor.tsx), [listening-player.tsx](app/(app)/listening/[id]/listening-player.tsx) and the two exam runners. It always runs in this order: upsert progress row → unlock the next item → parallel RPC wave → `checkAndUnlockAchievements()` → award bonus XP for anything unlocked. Mirror it exactly when adding a track.

### Progression / unlocking

Two different mechanisms, deliberately:

- **Lessons** chain in the database via `lessons.unlock_after_lesson_id`; the player upserts the next lesson's progress row to `available`.
- **Writing and listening** compute availability positionally in the server component: task *n* is available if task *n−1* is completed, first is always available. No DB chain is consulted.

### A2 / B1 duality

`profiles.current_level` switches the whole app, and every track carries a *parallel set* of columns: `exam_target_date`/`b1_exam_target_date`, `exam_completed`/`b1_exam_completed`, and the same for writing and listening. Any page reading a completion flag or exam date must branch on level — see [app/(app)/writing/page.tsx](app/(app)/writing/page.tsx) for the canonical shape. Completing a track's exam hides it from both navs and redirects its routes to `/dashboard`. KNM is A2-only.

### Achievements

[lib/achievements.ts](lib/achievements.ts) re-evaluates *every* achievement after any completion, from a single parallel read of the user's progress tables, then upserts newly-unlocked rows and returns them for toasts. It is called client-side with the user's own Supabase client. Rows live in the `achievements` table; adding one means seeding the row **and** extending both the unlock logic here and `ACHIEVEMENT_TITLES` (below).

### KNM

Uniquely, KNM has no database tables — its ~40-question bank and two mock exams live in [app/(app)/knm/knm-data.ts](app/(app)/knm/knm-data.ts) and progress is client-local.

## UI conventions

- **Styling is inline `style={{}}` objects driven by `getColors(isDark)` from [lib/use-theme.ts](lib/use-theme.ts)**, not Tailwind utility classes — Tailwind is loaded but used only for a few layout/responsive escapes (`md:hidden`, spacing). Each page declares its own local `const font = { headline: "'Plus Jakarta Sans'…", body: "'Noto Serif'…" }`. Colour tokens are duplicated as CSS variables in [app/globals.css](app/globals.css) for the light/dark `:root`/`.dark` blocks; keep the two in sync. [DESIGN.md](DESIGN.md) is the full MD3-derived design system.
- Dark mode is a `dark` class on `<html>`, set pre-paint by an inline script in [app/layout.tsx](app/layout.tsx) and persisted to `localStorage`.
- Icons are the self-hosted **Material Symbols** font (`<span className="mso">icon_name</span>`), subset into `public/fonts/`. `lucide-react` is present but used in one place only — prefer `mso`.
- Animations are CSS classes (`fm-fade-up`, `fm-rise`, `tap-shrink`, …) that replaced framer-motion. Don't reintroduce a motion library.
- All dates/streaks use Amsterdam time via `getAmsterdamDate()` / `getAmsterdamHour()` in [lib/utils.ts](lib/utils.ts), matching the Postgres functions' `Europe/Amsterdam` casts.
- Vocabulary scheduling is SM-2 (`calculateNextReview` in [lib/utils.ts](lib/utils.ts)); a card is "mastered" at an interval ≥ 21 days.

## UI Language

The profile page UI must be entirely in English. The app teaches Dutch, but all interface labels, buttons, section headers, and status text should be English. (The desktop `TopNav` is still Dutch-labelled; the mobile nav is English.)

Achievement titles come from the Supabase `achievements` table (stored in Dutch). The `ACHIEVEMENT_TITLES` map in [app/(app)/profile/profile-client.tsx](app/(app)/profile/profile-client.tsx) translates them by `key` — update this map if new achievements are added.

## Text-to-Speech

All listening audio uses Google Cloud TTS **Chirp3-HD** voices (Dutch: `nl-NL-Chirp3-HD-Charon` (male), `nl-NL-Chirp3-HD-Kore` (female A), `nl-NL-Chirp3-HD-Leda` (female B)). Do not introduce Wavenet, Neural2, or Standard voices in new seed scripts or audio generation paths. Chirp3-HD rejects SSML and the `pitch` parameter — [scripts/generate-listening-audio.ts](scripts/generate-listening-audio.ts) already handles this; preserve that behavior.

Audio is synthesized per row, dialogues concatenated turn-by-turn with ffmpeg, uploaded to the `listening-audio` Storage bucket at `{level}/week-{n}/{id}.mp3` with a 1-year cache header, and the public URL written back to the row. Rows with a non-null `audio_url` are skipped unless `--force`.

## PWA

[public/sw.js](public/sw.js) is hand-written and deliberately minimal: cache-first for `/_next/static/` and `/fonts/`, network-first for navigations with an `/offline.html` fallback, everything else (RSC payloads, Supabase, audio) untouched. **Bump `VERSION` in it when replacing a non-hashed asset under `/public`.** `next.config.ts` exists solely to send no-store headers for `/sw.js`.

## Git

`main` is the default branch; feature work lands on `dev` and is merged in. Commit messages follow `type(scope): summary`.

## Settle track (Expat OS)

A second product surface alongside the exam tracks: Netherlands
admin (arrival stack, 30% ruling, healthcare, residency).

- Lives under `app/(app)/settle/`. Never inside a level-branched track.
- Tables are prefixed `settle_` in `public`. Do NOT create a new
  Postgres schema — PostgREST only exposes configured schemas.
- Regulatory rules are DATA, never hardcoded branches. A rule row
  carries trigger conditions, deadline offsets, and
  `effective_from` / `effective_to`.
- Rules are immutable reference content: read them through the
  `unstable_cache` pattern in `lib/supabase/reference.ts`.
  User-scoped settle tables are NEVER read that way.
- No LLM calls anywhere in eligibility or deadline logic.
  Deterministic functions only.
- Nothing here is legal, tax or immigration advice. Every surface
  renders a disclaimer component.
- Settle progress does NOT award XP, streaks or achievements.
  Do not touch `increment_xp`, `increment_streak`, or
  `checkAndUnlockAchievements`.
- Not level-branched. Ignore `current_level` entirely.