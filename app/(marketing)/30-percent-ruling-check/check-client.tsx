"use client";

import { useRouter } from "next/navigation";
import { RulingFlow } from "@/components/settle/ruling-flow";
import { useTheme, getColors } from "@/lib/use-theme";
import { stashRun } from "@/lib/settle/ruling-stash";

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

/** Where the user is sent to sign in, and where they come back to. */
const SAVE_PATH = "/30-percent-ruling-check/save";

/**
 * The public 30% ruling checker.
 *
 * Anonymous by construction. It renders the shared <RulingFlow> with **no
 * `onComplete`**, so there is no code path from here to a write — the answers
 * and the verdict live in React state and nowhere else, and the component tree
 * below this point does not import a Supabase client at all. No account is
 * needed to see the result.
 *
 * "Save this result" is the only thing that leaves the page: it parks the
 * answers in browser storage and sends the user to sign up. The write happens
 * afterwards, on /…/save, once there is a session to own the row.
 */
export function CheckClient() {
  const router = useRouter();
  const { isDark } = useTheme();
  const c = getColors(isDark);

  return (
    <RulingFlow
      prefill={{}}
      backLink={{ href: "/settle-in-nl", label: "Settle in NL" }}
      resultCta={(_result, answers) => (
        <button
          type="button"
          className="tap-shrink"
          onClick={() => {
            stashRun(answers);
            router.push(`/signup?next=${encodeURIComponent(SAVE_PATH)}`);
          }}
          style={{
            flex: 1, minWidth: 140, padding: "14px 16px", borderRadius: 9999,
            border: "none", cursor: "pointer",
            fontFamily: font.headline, fontSize: 14, fontWeight: 800,
            background: `${c.primary}12`, color: c.primary,
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          Save this result
          <span className="mso" aria-hidden="true" style={{ fontSize: 17 }}>bookmark_add</span>
        </button>
      )}
    />
  );
}
