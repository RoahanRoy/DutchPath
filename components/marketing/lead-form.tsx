"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTheme, getColors } from "@/lib/use-theme";
import type { Database } from "@/lib/supabase/types";

type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

/** Postgres unique-violation. Here it means "already on the list". */
const UNIQUE_VIOLATION = "23505";

/**
 * Inline email capture for the marketing surfaces.
 *
 * The insert deliberately has no `.select()`: supabase-js then sends
 * `Prefer: return=minimal`, so PostgREST never reads the row back and the table
 * needs no SELECT policy. `leads` has only an INSERT policy (migration 0010) —
 * nothing can read it with the anon key, which is the point.
 *
 * A duplicate address is reported as success. It is the honest outcome (they are
 * on the list), and distinguishing it would turn this box into an oracle for
 * "is this address subscribed?".
 */
export function LeadForm({
  source,
  label,
  placeholder = "you@example.com",
  button = "Keep me posted",
  success = "You're on the list.",
}: {
  /** Which surface captured it: "landing", "guide:<slug>". */
  source: string;
  label: string;
  placeholder?: string;
  button?: string;
  success?: string;
}) {
  const { isDark } = useTheme();
  const c = getColors(isDark);

  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "sending") return;
    setError("");
    setState("sending");

    const row: LeadInsert = { email: email.trim(), source };

    // The hand-written `Database` type does not satisfy postgrest-js's
    // GenericSchema (no per-table `Relationships`), so every write in this
    // codebase infers its payload as `never` and is cast at the call site --
    // see app/onboarding/page.tsx. The payload const above is typed against the
    // Insert type, so the data itself is still checked.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (createClient().from("leads") as any).insert(row);

    if (err && err.code !== UNIQUE_VIOLATION) {
      setError("That did not go through. Try again in a moment.");
      setState("idle");
      return;
    }

    setState("done");
  };

  if (state === "done") {
    return (
      <p role="status" style={{
        display: "inline-flex", alignItems: "center", gap: 8, margin: 0,
        padding: "12px 16px", borderRadius: 12,
        background: `${c.success}15`, color: c.success,
        fontFamily: font.headline, fontSize: 14, fontWeight: 700,
      }}>
        <span className="mso mso-fill" aria-hidden="true" style={{ fontSize: 18 }}>check_circle</span>
        {success}
      </p>
    );
  }

  return (
    <form onSubmit={submit} style={{ fontFamily: font.headline }}>
      <label htmlFor={`lead-${source}`} style={{
        display: "block", marginBottom: 8,
        fontSize: 13, fontWeight: 600, color: c.onSurfaceVariant, lineHeight: 1.55,
      }}>
        {label}
      </label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          id={`lead-${source}`}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: "1 1 220px", minWidth: 0, padding: "13px 16px", borderRadius: 14,
            border: `1.5px solid ${c.outlineVariant}`, background: c.surfaceLowest,
            fontSize: 15, fontWeight: 600, fontFamily: font.headline,
            color: c.onSurface, outline: "none",
          }}
        />
        <button
          type="submit"
          className="tap-shrink"
          disabled={state === "sending"}
          style={{
            flex: "0 0 auto", padding: "13px 22px", borderRadius: 14, border: "none",
            cursor: state === "sending" ? "default" : "pointer",
            fontSize: 15, fontWeight: 800, fontFamily: font.headline, color: "#fff",
            background: `linear-gradient(to bottom, ${c.primary}, ${c.primaryContainer})`,
            opacity: state === "sending" ? 0.6 : 1,
          }}
        >
          {state === "sending" ? "Sending…" : button}
        </button>
      </div>
      {error && (
        <p role="alert" style={{ margin: "8px 0 0", fontSize: 13, fontWeight: 600, color: c.error }}>
          {error}
        </p>
      )}
    </form>
  );
}
