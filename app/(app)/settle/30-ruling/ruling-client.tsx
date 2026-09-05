"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { RulingFlow } from "@/components/settle/ruling-flow";
import { useTheme, getColors } from "@/lib/use-theme";
import { storedComputed, type RulingAnswers } from "@/lib/settle/ruling-30";
import type { Database, Json } from "@/lib/supabase/types";

type RulingCheckInsert = Database["public"]["Tables"]["settle_ruling_checks"]["Insert"];

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

/**
 * The signed-in 30% ruling checker.
 *
 * The whole flow lives in <RulingFlow>, shared with the public checker at
 * /30-percent-ruling-check. This wrapper is only the half that cannot be shared:
 * a user id, a write, and a link back into the app. Keeping the write here is
 * what lets the public flow be structurally incapable of persisting anything.
 *
 * No XP, no streak, no achievements — the Settle track is deliberately not wired
 * into the gamification tables.
 */
export function RulingClient({
  userId,
  prefill,
}: {
  userId: string;
  prefill: Partial<RulingAnswers>;
}) {
  const { isDark } = useTheme();
  const c = getColors(isDark);

  return (
    <RulingFlow
      prefill={prefill}
      backLink={{ href: "/settle", label: "Settle" }}
      onComplete={async (answers, result) => {
        const supabase = createClient();
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
          return { error: `Your result is below, but it could not be saved: ${error.message}` };
        }
      }}
      resultCta={() => (
        <Link
          href="/settle"
          className="tap-shrink"
          style={{
            flex: 1, minWidth: 140, padding: "14px 16px", borderRadius: 9999,
            fontFamily: font.headline, fontSize: 14, fontWeight: 800, textDecoration: "none",
            background: `${c.primary}12`, color: c.primary,
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          Back to Settle
          <span className="mso" aria-hidden="true" style={{ fontSize: 17 }}>arrow_forward</span>
        </Link>
      )}
    />
  );
}
