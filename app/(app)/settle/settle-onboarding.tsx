"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { computeTimeline } from "@/lib/settle/timeline";
import { SettleDisclaimer } from "@/components/settle-disclaimer";
import { useTheme, getColors } from "@/lib/use-theme";
import type { Database, SettleProfile, SettleRule } from "@/lib/supabase/types";

type SettleProfileInsert = Database["public"]["Tables"]["settle_profile"]["Insert"];
type TimelineInsert = Database["public"]["Tables"]["settle_timeline_items"]["Insert"];
type Palette = ReturnType<typeof getColors>;

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

/**
 * The stored values below are load-bearing: they are matched verbatim by the
 * `trigger_conditions` on the seeded rules (scripts/seed-settle-rules.ts).
 * `non_eu` fires the two IND rules; `dutch_employer` fires the 30% ruling rule.
 * Renaming one here silently empties a section of every user's timeline.
 */
const PERMIT_TYPES = [
  { value: "kennismigrant", label: "Kennismigrant", hint: "Highly skilled migrant" },
  { value: "eu_blue_card", label: "EU Blue Card", hint: "EU-wide highly qualified" },
  { value: "partner", label: "Partner / family", hint: "Joining a partner or family" },
  { value: "student", label: "Student", hint: "Study permit" },
  { value: "eu_eea", label: "EU / EEA citizen", hint: "No permit required" },
  { value: "other", label: "Other", hint: "Something else" },
];

const NATIONALITY_GROUPS = [
  { value: "eu_eea_swiss", label: "EU, EEA or Swiss", hint: "Free movement applies" },
  { value: "non_eu", label: "Non-EU", hint: "IND permit rules apply" },
];

const EMPLOYER_TYPES = [
  { value: "dutch_employer", label: "Dutch employer", hint: "On a Dutch payroll" },
  { value: "self_employed", label: "Self-employed", hint: "ZZP or own company" },
  { value: "none", label: "Nothing yet", hint: "Still looking, or not working" },
];

/* ── A choice group: label + a stack of option buttons ──────────────────────
   At module scope, not inside SettleOnboarding: a component created during
   render gets a fresh identity on every pass, which remounts the whole
   fieldset on each keystroke (and the React Compiler rejects it outright). */
function Choice({
  legend,
  hint,
  options,
  value,
  onChange,
  c,
}: {
  legend: string;
  hint: string;
  options: { value: string; label: string; hint: string }[];
  value: string;
  onChange: (v: string) => void;
  c: Palette;
}) {
  return (
    <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
      <legend style={{ padding: 0, marginBottom: 4 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: c.onSurface, letterSpacing: "-0.01em" }}>
          {legend}
        </span>
      </legend>
      <p style={{ fontSize: 13, fontWeight: 500, color: c.onSurfaceVariant, margin: "0 0 12px" }}>{hint}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {options.map((o) => {
          const selected = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              className="tap-shrink"
              onClick={() => onChange(o.value)}
              aria-pressed={selected}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px", borderRadius: 16, border: "none", cursor: "pointer",
                fontFamily: font.headline, textAlign: "left", transition: "background 0.2s, box-shadow 0.2s",
                background: selected ? `${c.primary}12` : c.surfaceLow,
                boxShadow: selected ? `0 0 0 2px ${c.primary}` : "none",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: selected ? c.primary : c.onSurface }}>
                  {o.label}
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: c.onSurfaceVariant, marginTop: 2 }}>
                  {o.hint}
                </div>
              </div>
              {selected && (
                <span className="mso mso-fill" aria-hidden="true" style={{ fontSize: 20, color: c.primary }}>
                  check_circle
                </span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/* ── A yes/no pair ── */
function YesNo({
  legend,
  hint,
  value,
  onChange,
  c,
}: {
  legend: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
  c: Palette;
}) {
  return (
    <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
      <legend style={{ padding: 0, marginBottom: 4 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: c.onSurface, letterSpacing: "-0.01em" }}>
          {legend}
        </span>
      </legend>
      <p style={{ fontSize: 13, fontWeight: 500, color: c.onSurfaceVariant, margin: "0 0 12px" }}>{hint}</p>
      <div style={{ display: "flex", gap: 8 }}>
        {[
          { v: true, label: "Yes" },
          { v: false, label: "Not yet" },
        ].map(({ v, label }) => {
          const selected = value === v;
          return (
            <button
              key={label}
              type="button"
              className="tap-shrink"
              onClick={() => onChange(v)}
              aria-pressed={selected}
              style={{
                flex: 1, padding: "14px 16px", borderRadius: 16, border: "none", cursor: "pointer",
                fontFamily: font.headline, fontSize: 14, fontWeight: 700,
                transition: "background 0.2s, box-shadow 0.2s",
                background: selected ? `${c.primary}12` : c.surfaceLow,
                boxShadow: selected ? `0 0 0 2px ${c.primary}` : "none",
                color: selected ? c.primary : c.onSurface,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function SettleOnboarding({ userId, rules }: { userId: string; rules: SettleRule[] }) {
  const router = useRouter();
  const { isDark } = useTheme();
  const c = getColors(isDark);

  const [arrivalDate, setArrivalDate] = useState("");
  const [permitType, setPermitType] = useState("");
  const [nationalityGroup, setNationalityGroup] = useState("");
  const [employerType, setEmployerType] = useState("");
  const [hasBsn, setHasBsn] = useState(false);
  const [hasDigid, setHasDigid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    // Arrival date anchors every seeded rule. Without it resolveAnchor returns
    // null, each rule lands as `not_applicable`, and the user reaches an empty
    // timeline after a form that appeared to succeed — so it is required.
    if (!arrivalDate) { setError("Please give your arrival date — every deadline is counted from it."); return; }
    if (!permitType) { setError("Please choose a permit type."); return; }
    if (!nationalityGroup) { setError("Please choose a nationality group."); return; }
    if (!employerType) { setError("Please choose an employer situation."); return; }

    setLoading(true);
    const supabase = createClient();
    const now = new Date().toISOString();

    const profile: SettleProfile = {
      user_id: userId,
      arrival_date: arrivalDate,
      permit_type: permitType,
      nationality_group: nationalityGroup,
      employer_type: employerType,
      // Not asked here. `false` is what makes the 30% ruling rule appear on the
      // timeline; the ruling checker that sets it is a later session.
      has_30_percent_ruling: false,
      has_bsn: hasBsn,
      has_digid: hasDigid,
      created_at: now,
      updated_at: now,
    };

    // created_at / updated_at are left to the column defaults.
    const profileRow: SettleProfileInsert = {
      user_id: profile.user_id,
      arrival_date: profile.arrival_date,
      permit_type: profile.permit_type,
      nationality_group: profile.nationality_group,
      employer_type: profile.employer_type,
      has_30_percent_ruling: profile.has_30_percent_ruling,
      has_bsn: profile.has_bsn,
      has_digid: profile.has_digid,
    };

    // The hand-written `Database` type does not satisfy postgrest-js's
    // GenericSchema (no per-table `Relationships`), so every write in this
    // codebase infers its payload as `never` and is cast at the call site —
    // see app/onboarding/page.tsx. The payload consts are typed against the
    // Insert types, so the data itself is still checked.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await (supabase.from("settle_profile") as any).insert(profileRow);

    if (profileError) {
      setError(`Could not save your details: ${profileError.message}`);
      setLoading(false);
      return;
    }

    const items = computeTimeline(profile, rules);
    if (items.length > 0) {
      const rows: TimelineInsert[] = items.map((i) => ({ ...i, user_id: userId }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: itemsError } = await (supabase.from("settle_timeline_items") as any).insert(rows);

      if (itemsError) {
        // The profile row stands, so the page's reconcile pass will fill these
        // in on the next load. Say so rather than pretending nothing happened.
        setError(`Your details were saved, but the timeline could not be built: ${itemsError.message}. Reload the page to retry.`);
        setLoading(false);
        return;
      }
    }

    router.refresh();
  };

  return (
    <div style={{ background: c.background, color: c.onSurface, fontFamily: font.headline, minHeight: "100vh" }}>
      <main style={{ padding: "24px 24px 128px", maxWidth: 480, margin: "0 auto" }}>

        {/* ── Header ── */}
        <section className="fm-fade-up" style={{ marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: `${c.primary}15`,
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18,
          }}>
            <span className="mso mso-fill" aria-hidden="true" style={{ fontSize: 28, color: c.primary }}>flight_land</span>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: c.primary, letterSpacing: "-0.025em", margin: 0 }}>
            Settle
          </h1>
          <p style={{ fontSize: 14, fontWeight: 500, color: c.onSurfaceVariant, lineHeight: 1.6, margin: "8px 0 0" }}>
            Six questions, then we build your Dutch admin timeline — registration,
            BSN, DigiD, health insurance, tax and residency, each with the deadline
            that applies to your situation.
          </p>
        </section>

        {/* ── The six questions ── */}
        <div className="fm-fade-up" style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          {/* 1 — Arrival date */}
          <div>
            <label htmlFor="settle-arrival" style={{ display: "block", marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: c.onSurface, letterSpacing: "-0.01em" }}>
                When did you arrive?
              </span>
            </label>
            <p style={{ fontSize: 13, fontWeight: 500, color: c.onSurfaceVariant, margin: "0 0 12px" }}>
              Or the date you plan to arrive. Every deadline is counted from this day.
            </p>
            <div style={{ position: "relative" }}>
              <span className="mso" aria-hidden="true" style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                fontSize: 18, color: c.outline, pointerEvents: "none",
              }}>
                calendar_today
              </span>
              <input
                id="settle-arrival"
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                style={{
                  width: "100%", padding: "14px 14px 14px 44px", borderRadius: 16,
                  border: `1.5px solid ${c.outlineVariant}`, background: c.surfaceLow,
                  fontSize: 14, fontFamily: font.headline, color: c.onSurface, outline: "none",
                }}
              />
            </div>
          </div>

          {/* 2 — Permit type */}
          <Choice
            legend="What are you here on?"
            hint="Your residence basis. We store it now and use it as more rules land."
            options={PERMIT_TYPES}
            value={permitType}
            onChange={setPermitType}
            c={c}
          />

          {/* 3 — Nationality group */}
          <Choice
            legend="Which passport do you hold?"
            hint="This decides whether the IND permit steps apply to you."
            options={NATIONALITY_GROUPS}
            value={nationalityGroup}
            onChange={setNationalityGroup}
            c={c}
          />

          {/* 4 — Employer type */}
          <Choice
            legend="How are you working?"
            hint="The 30% ruling window only opens for employed arrivals."
            options={EMPLOYER_TYPES}
            value={employerType}
            onChange={setEmployerType}
            c={c}
          />

          {/* 5 — BSN */}
          <YesNo
            legend="Do you already have a BSN?"
            hint="Your citizen service number, issued when you register with a gemeente."
            value={hasBsn}
            onChange={setHasBsn}
            c={c}
          />

          {/* 6 — DigiD */}
          <YesNo
            legend="Do you already have DigiD?"
            hint="The national login for government and healthcare services."
            value={hasDigid}
            onChange={setHasDigid}
            c={c}
          />
        </div>

        {error && (
          <div
            className="fm-fade-down"
            role="alert"
            style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              padding: "12px 16px", borderRadius: 12, marginTop: 20,
              background: `${c.error}15`, color: c.error,
              fontSize: 13, fontWeight: 600, lineHeight: 1.5,
            }}
          >
            <span className="mso" aria-hidden="true" style={{ fontSize: 18, flexShrink: 0 }}>error</span>
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%", padding: 16, borderRadius: 9999, border: "none",
            cursor: loading ? "default" : "pointer", marginTop: 28,
            fontSize: 16, fontWeight: 800, fontFamily: font.headline, color: "#fff",
            background: `linear-gradient(to bottom, ${c.primary}, ${c.primaryContainer})`,
            boxShadow: `0 10px 20px -5px ${c.primary}40`,
            opacity: loading ? 0.6 : 1, transition: "opacity 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {loading ? (
            <span className="mso" aria-hidden="true" style={{ fontSize: 18, animation: "settleSpin 1s linear infinite" }}>
              progress_activity
            </span>
          ) : (
            <>
              Build my timeline
              <span className="mso" aria-hidden="true" style={{ fontSize: 18 }}>arrow_forward</span>
            </>
          )}
        </button>

        <div style={{ marginTop: 28 }}>
          <SettleDisclaimer />
        </div>
      </main>

      <style>{`@keyframes settleSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
