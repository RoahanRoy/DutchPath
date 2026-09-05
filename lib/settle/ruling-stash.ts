import { RULESET_VERSION, parseAnswers, type RulingAnswers } from "./ruling-30";

/**
 * The public 30% ruling check parks a completed run in browser storage while the
 * user signs in, then writes it once they land back on /…/save.
 *
 * Only the ANSWERS are stashed, never the verdict. The save page recomputes with
 * evaluate() — browser storage is writable by whoever owns the browser, and
 * recomputing also guarantees a stored row can never disagree with the ruleset
 * that produced it.
 *
 * ── Why two storages ────────────────────────────────────────────────────────
 * sessionStorage is the right primary: it is scoped to the tab and dies with it,
 * so a shared machine cannot leak one visitor's answers to the next. It covers
 * the password and OAuth flows, which both redirect within the same tab.
 *
 * It does NOT cover email signup. A confirmation link opens a new tab, and
 * sessionStorage does not cross tabs — the answers would be silently lost for
 * every user who signs up by email. So the stash is mirrored to localStorage
 * with a one-hour expiry as the fallback, and both copies are cleared together
 * on a successful write.
 *
 * Every access is wrapped: storage throws outright in some privacy modes, and a
 * failed stash must degrade to "we could not find your answers", never to a
 * crash on the result screen.
 */

const KEY = "dutchpath:ruling-30:pending";

/** How long a parked run stays valid. Long enough to read a confirmation email. */
const MAX_AGE_MS = 60 * 60 * 1000;

type StashedRun = {
  /** The ruleset the answers were collected under. */
  v: string;
  /** ISO timestamp, for the expiry check. */
  at: string;
  answers: Partial<RulingAnswers>;
};

export function stashRun(answers: Partial<RulingAnswers>): void {
  const payload = JSON.stringify({
    v: RULESET_VERSION,
    at: new Date().toISOString(),
    answers,
  } satisfies StashedRun);

  try {
    window.sessionStorage.setItem(KEY, payload);
  } catch {
    // Ignored: the localStorage mirror below may still succeed.
  }
  try {
    window.localStorage.setItem(KEY, payload);
  } catch {
    // Ignored: nothing is recoverable, and the save page says so honestly.
  }
}

/**
 * The parked run, or null when there is nothing usable.
 *
 * Returns null — rather than something partial — when the stash is missing,
 * unparseable, expired, or was collected under a different RULESET_VERSION. A
 * version bump means the published figures moved between the check and the save,
 * and persisting a verdict against numbers that have since changed would be
 * worse than asking the user to run it again.
 */
export function readStashedRun(): Partial<RulingAnswers> | null {
  for (const store of storages()) {
    const raw = safeGet(store);
    if (!raw) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }

    const run = parsed as Partial<StashedRun> | null;
    if (!run || typeof run !== "object") continue;
    if (run.v !== RULESET_VERSION) continue;

    const at = typeof run.at === "string" ? Date.parse(run.at) : NaN;
    if (!Number.isFinite(at) || Date.now() - at > MAX_AGE_MS) continue;

    const answers = parseAnswers(run.answers);
    if (answers && Object.keys(answers).length > 0) return answers;
  }

  return null;
}

/** Drops both copies. Called only after a successful write. */
export function clearStashedRun(): void {
  for (const store of storages()) {
    try {
      store?.removeItem(KEY);
    } catch {
      // Nothing useful to do; the expiry check will retire it anyway.
    }
  }
}

function storages(): (Storage | null)[] {
  if (typeof window === "undefined") return [];
  return [safeStore(() => window.sessionStorage), safeStore(() => window.localStorage)];
}

function safeStore(get: () => Storage): Storage | null {
  try {
    return get();
  } catch {
    return null;
  }
}

function safeGet(store: Storage | null): string | null {
  try {
    return store?.getItem(KEY) ?? null;
  } catch {
    return null;
  }
}
