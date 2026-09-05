"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme, getColors } from "@/lib/use-theme";
import { evaluate, storedComputed } from "@/lib/settle/ruling-30";
import { readStashedRun, clearStashedRun } from "@/lib/settle/ruling-stash";
import type { Database, Json } from "@/lib/supabase/types";

type RulingCheckInsert = Database["public"]["Tables"]["settle_ruling_checks"]["Insert"];

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

const CHECK_PATH = "/30-percent-ruling-check";
const SAVE_PATH = "/30-percent-ruling-check/save";

type Phase = "working" | "missing" | "failed";

/**
 * Writes a run held from the anonymous checker, once the user has signed in.
 *
 * The verdict is RECOMPUTED here rather than carried across the redirect. The
 * stash holds only answers, and browser storage is writable by whoever owns the
 * browser — so the number that gets stored is one this code derived, from
 * answers this code re-validated.
 *
 * ── The Strict Mode hazard ──────────────────────────────────────────────────
 * This is a write from an effect, and React Strict Mode (on by default in the
 * App Router) invokes effects twice in development. Without a guard that is two
 * rows for one check. `startedRef` is set synchronously on the first pass and
 * survives the remount, because a ref is not reset by Strict Mode's replay — a
 * state flag would be. Do not replace it with one.
 */
export function SaveClient() {
  const router = useRouter();
  const { isDark } = useTheme();
  const c = getColors(isDark);

  const startedRef = useRef(false);
  const [phase, setPhase] = useState<Phase>("working");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    void (async () => {
      const answers = readStashedRun();
      if (!answers) {
        if (!cancelled) setPhase("missing");
        return;
      }

      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;

      if (!userId) {
        // Not signed in yet. Keep the stash and come back here afterwards.
        router.replace(`/login?next=${encodeURIComponent(SAVE_PATH)}`);
        return;
      }

      const result = evaluate(answers);
      const row: RulingCheckInsert = {
        user_id: userId,
        answers: answers as unknown as Json,
        computed: storedComputed(answers, result) as unknown as Json,
        verdict: result.verdict,
      };

      // The hand-written `Database` type does not satisfy postgrest-js's
      // GenericSchema (no per-table `Relationships`), so every write in this
      // codebase infers its payload as `never` and is cast at the call site --
      // see app/onboarding/page.tsx. The payload const above is typed against
      // the Insert type, so the data itself is still checked.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("settle_ruling_checks") as any).insert(row);

      if (error) {
        // The stash is deliberately NOT cleared: the run is still recoverable,
        // and reloading this page retries the write.
        if (!cancelled) {
          setDetail(error.message);
          setPhase("failed");
        }
        return;
      }

      clearStashedRun();
      router.replace("/settle");
    })();

    return () => { cancelled = true; };
  }, [router]);

  const shell = {
    minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center",
    padding: "48px 24px", fontFamily: font.headline,
  } as const;

  const card = {
    maxWidth: 420, width: "100%", padding: 28, borderRadius: 24, textAlign: "center",
    background: c.surfaceLowest, boxShadow: "0px 4px 16px rgba(26,28,27,0.04)",
  } as const;

  if (phase === "working") {
    return (
      <div style={shell}>
        <div className="fm-fade-up" style={card}>
          <span className="mso" aria-hidden="true" style={{ fontSize: 32, color: c.primary }}>cloud_upload</span>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: c.onSurface, margin: "10px 0 0" }}>
            Saving your result…
          </h1>
          <p style={{ fontSize: 13, fontWeight: 500, color: c.onSurfaceVariant, lineHeight: 1.6, margin: "8px 0 0" }}>
            One moment. You will land on your Settle timeline.
          </p>
        </div>
      </div>
    );
  }

  const failed = phase === "failed";

  return (
    <div style={shell}>
      <div className="fm-fade-up" style={card}>
        <span className="mso" aria-hidden="true" style={{ fontSize: 32, color: failed ? c.error : c.secondary }}>
          {failed ? "cloud_off" : "search_off"}
        </span>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: c.onSurface, margin: "10px 0 0" }}>
          {failed ? "That did not save" : "We could not find your answers"}
        </h1>
        <p style={{
          fontFamily: font.body, fontSize: 13, fontWeight: 400,
          color: c.onSurfaceVariant, lineHeight: 1.65, margin: "10px 0 0",
        }}>
          {failed
            ? `Your answers are still held in this browser, so reloading this page will try again. ${detail}`
            : "A held result only lasts an hour, and only in the browser you ran the check in. Running the check again takes about two minutes."}
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
          <Link href={CHECK_PATH} className="tap-shrink" style={{
            flex: 1, minWidth: 140, padding: "13px 16px", borderRadius: 9999,
            textDecoration: "none", fontSize: 14, fontWeight: 800,
            background: `${c.primary}12`, color: c.primary,
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            Run the check again
          </Link>
          <Link href="/settle" className="tap-shrink" style={{
            flex: 1, minWidth: 140, padding: "13px 16px", borderRadius: 9999,
            textDecoration: "none", fontSize: 14, fontWeight: 800,
            background: c.surfaceLow, color: c.onSurface,
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            Go to Settle
          </Link>
        </div>
      </div>
    </div>
  );
}
