"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SettleDisclaimer } from "@/components/settle-disclaimer";
import { useTheme, getColors } from "@/lib/use-theme";
import { getAmsterdamDate } from "@/lib/utils";
import type { Database, SettleRule, SettleSeverity, SettleTimelineItem } from "@/lib/supabase/types";

type TimelineUpdate = Database["public"]["Tables"]["settle_timeline_items"]["Update"];

const font = {
  headline: "'Plus Jakarta Sans', sans-serif",
  body: "'Noto Serif', serif",
};

/** One stored timeline row joined to the rule it was generated from. */
export type SettleEntry = {
  item: SettleTimelineItem;
  rule: SettleRule;
};

/** How far ahead "This month" reaches. A rolling window, not the calendar
 *  month — a deadline on the 2nd of next month matters more than one on the
 *  28th of this one. */
const HORIZON_DAYS = 30;

type Group = "overdue" | "soon" | "later" | "done";

const GROUP_META: Record<Group, { title: string; icon: string; blurb: string }> = {
  overdue: { title: "Overdue", icon: "warning", blurb: "Past the deadline — deal with these first." },
  soon: { title: "This month", icon: "schedule", blurb: `Due in the next ${HORIZON_DAYS} days.` },
  later: { title: "Later", icon: "event_upcoming", blurb: "Further out, or waiting on an earlier step." },
  done: { title: "Done", icon: "check_circle", blurb: "Cleared." },
};

const GROUP_ORDER: Group[] = ["overdue", "soon", "later", "done"];

/**
 * Interactive tools that belong to a rule.
 *
 * This maps a rule key to a ROUTE, not to a rule: the regulatory content still
 * comes from settle_rules, and a rule with no entry here simply renders without
 * the extra action. Adding a tool is a line here plus the route it points at.
 */
const TOOL_BY_RULE_KEY: Record<string, { href: string; label: string; icon: string }> = {
  ruling_30_percent_application: {
    href: "/settle/30-ruling",
    label: "Check eligibility",
    icon: "calculate",
  },
};

const SEVERITY_LABEL: Record<SettleSeverity, string> = {
  blocking: "Blocking",
  costly: "Costs money",
  routine: "Routine",
};

function severityColors(severity: SettleSeverity, c: ReturnType<typeof getColors>) {
  switch (severity) {
    case "blocking": return { fg: c.error, bg: `${c.error}15` };
    case "costly": return { fg: c.secondary, bg: `${c.secondary}15` };
    case "routine": return { fg: c.onSurfaceVariant, bg: c.surfaceHigh };
  }
}

/** Whole days from `fromIso` to `toIso`, both YYYY-MM-DD. Compared on the
 *  calendar parts so a DST boundary between them cannot shift the answer. */
function dayDiff(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split("-").map(Number);
  const [ty, tm, td] = toIso.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

function formatDue(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  });
}

function relativeDue(iso: string | null, today: string): string {
  if (!iso) return "No date yet";
  const diff = dayDiff(today, iso);
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  if (diff === -1) return "1 day overdue";
  if (diff < 0) return `${-diff} days overdue`;
  return `In ${diff} days`;
}

function groupOf(item: SettleTimelineItem, today: string): Group {
  if (item.status === "done" || item.status === "skipped") return "done";
  if (!item.due_date) return "later";
  const diff = dayDiff(today, item.due_date);
  if (diff < 0) return "overdue";
  if (diff <= HORIZON_DAYS) return "soon";
  return "later";
}

export function SettleClient({ entries }: { entries: SettleEntry[] }) {
  const { isDark } = useTheme();
  const c = getColors(isDark);
  const today = getAmsterdamDate();

  // Optimistic changes are held as an overrides map keyed by row id and merged
  // over the props on render, rather than copied into state. Copying would need
  // a useEffect to re-sync after router.refresh(); deriving means the server's
  // next render is authoritative for free.
  const [overrides, setOverrides] = useState<Record<number, Partial<SettleTimelineItem>>>({});
  const [pending, setPending] = useState<Record<number, boolean>>({});
  const [error, setError] = useState("");

  const rows: SettleEntry[] = entries.map((e) => ({
    rule: e.rule,
    item: { ...e.item, ...overrides[e.item.id] },
  }));

  const doneCount = rows.filter((r) => r.item.status === "done" || r.item.status === "skipped").length;
  const total = rows.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const allDone = total > 0 && doneCount === total;

  const markDone = async (item: SettleTimelineItem) => {
    setError("");
    const completedAt = new Date().toISOString();

    // Optimistic: move the card immediately, then confirm.
    setOverrides((prev) => ({ ...prev, [item.id]: { status: "done", completed_at: completedAt } }));
    setPending((prev) => ({ ...prev, [item.id]: true }));

    const supabase = createClient();
    const patch: TimelineUpdate = { status: "done", completed_at: completedAt };
    // The hand-written `Database` type does not satisfy postgrest-js's
    // GenericSchema (no per-table `Relationships`), so every write in this
    // codebase infers its payload as `never` and is cast at the call site --
    // see app/onboarding/page.tsx. The payload consts above are typed against
    // the Insert types, so the data itself is still checked.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase.from("settle_timeline_items") as any)
      .update(patch)
      .eq("id", item.id);

    setPending((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });

    if (updateError) {
      // Revert to whatever the server last told us.
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      setError(`Could not mark that done: ${updateError.message}`);
    }
  };

  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    rows: rows.filter((r) => groupOf(r.item, today) === g),
  })).filter((s) => s.rows.length > 0);

  return (
    <div style={{ background: c.background, color: c.onSurface, fontFamily: font.headline, minHeight: "100vh" }}>
      <main style={{ padding: "24px 24px 128px", maxWidth: 480, margin: "0 auto" }}>

        {/* ── Header + progress ── */}
        <section className="fm-fade-up" style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: c.primary, letterSpacing: "-0.025em", margin: 0 }}>
            Settle
          </h1>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 6, marginBottom: 8 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: c.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
              {doneCount} of {total} done
            </p>
            <p style={{ fontSize: 12, fontWeight: 700, color: c.primary, margin: 0 }}>{pct}%</p>
          </div>
          <div style={{ width: "100%", height: 12, background: c.surfaceHighest, borderRadius: 9999, overflow: "hidden" }}>
            <div className="fm-grow-x" style={{ width: `${pct}%`, height: "100%", background: c.primary, borderRadius: 9999 }} />
          </div>
        </section>

        {error && (
          <div
            className="fm-fade-down"
            role="alert"
            style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              padding: "12px 16px", borderRadius: 12, marginBottom: 20,
              background: `${c.error}15`, color: c.error,
              fontSize: 13, fontWeight: 600, lineHeight: 1.5,
            }}
          >
            <span className="mso" aria-hidden="true" style={{ fontSize: 18, flexShrink: 0 }}>error</span>
            {error}
          </div>
        )}

        {/* ── Tools ──
             A card rather than a row inside a group: the checker is not a
             deadline, and it stays reachable for users the 30% ruling rule never
             fires for (self-employed) or who have already marked it done. */}
        <Link
          href="/settle/30-ruling"
          className="fm-fade-up tap-shrink"
          style={{
            display: "flex", alignItems: "center", gap: 14, marginBottom: 28,
            background: c.surfaceLowest, borderRadius: 20, padding: 18,
            boxShadow: "0px 4px 16px rgba(26,28,27,0.04)", textDecoration: "none",
          }}
        >
          <div style={{
            flexShrink: 0, width: 44, height: 44, borderRadius: 14, background: `${c.primary}12`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span className="mso" aria-hidden="true" style={{ fontSize: 22, color: c.primary }}>calculate</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: c.onSurface, lineHeight: 1.3 }}>
              30% ruling check
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: c.onSurfaceVariant, marginTop: 3, lineHeight: 1.5 }}>
              A few questions against the Belastingdienst conditions. Guidance only — nothing is filed.
            </div>
          </div>
          <span className="mso" aria-hidden="true" style={{ fontSize: 20, color: c.outline, flexShrink: 0 }}>
            chevron_right
          </span>
        </Link>

        {/* ── Empty: a profile exists but nothing was generated ── */}
        {total === 0 && (
          <div className="fm-rise" style={{
            background: c.surfaceLowest, borderRadius: 24, padding: 28, textAlign: "center",
            boxShadow: "0px 12px 32px rgba(26,28,27,0.06)", marginBottom: 24,
          }}>
            <span className="mso" aria-hidden="true" style={{ fontSize: 40, color: c.outline }}>inbox</span>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: c.onSurface, margin: "12px 0 0" }}>
              Nothing on your timeline yet
            </h2>
            <p style={{ fontSize: 13, fontWeight: 500, color: c.onSurfaceVariant, lineHeight: 1.6, margin: "8px 0 0" }}>
              No rule currently in force applies to the details you gave. Reload the
              page after new guidance is added and anything relevant will appear here.
            </p>
          </div>
        )}

        {/* ── All done ── */}
        {allDone && (
          <div className="fm-rise" style={{
            background: `${c.success}12`, borderRadius: 24, padding: 28, textAlign: "center", marginBottom: 24,
          }}>
            <span className="mso mso-fill" aria-hidden="true" style={{ fontSize: 40, color: c.success }}>task_alt</span>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: c.onSurface, margin: "12px 0 0" }}>
              Your arrival stack is clear
            </h2>
            <p style={{ fontSize: 13, fontWeight: 500, color: c.onSurfaceVariant, lineHeight: 1.6, margin: "8px 0 0" }}>
              All {total} steps are marked done. Keep an eye on this page — new
              deadlines appear as your situation and the rules change.
            </p>
          </div>
        )}

        {/* ── Groups ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {grouped.map(({ group, rows: groupRows }) => {
            const meta = GROUP_META[group];
            const isDoneGroup = group === "done";
            const accent = group === "overdue" ? c.error : group === "soon" ? c.primary : c.onSurfaceVariant;

            return (
              <section key={group}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span className="mso" aria-hidden="true" style={{ fontSize: 18, color: accent }}>{meta.icon}</span>
                  <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: accent, margin: 0 }}>
                    {meta.title}
                  </h2>
                  <span style={{ fontSize: 12, fontWeight: 700, color: c.onSurfaceVariant }}>· {groupRows.length}</span>
                </div>
                <p style={{ fontSize: 12, fontWeight: 500, color: c.onSurfaceVariant, margin: "0 0 14px" }}>
                  {meta.blurb}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {groupRows.map(({ item, rule }) => {
                    const sev = severityColors(rule.severity, c);
                    const isPending = !!pending[item.id];
                    const tool = TOOL_BY_RULE_KEY[rule.key];

                    return (
                      <article
                        key={item.id}
                        className="fm-fade-up"
                        style={{
                          background: c.surfaceLowest, borderRadius: 20, padding: 18,
                          boxShadow: "0px 4px 16px rgba(26,28,27,0.04)",
                          opacity: isDoneGroup ? 0.65 : 1,
                          transition: "opacity 0.2s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                          <h3 style={{
                            flex: 1, fontSize: 15, fontWeight: 800, color: c.onSurface,
                            lineHeight: 1.35, margin: 0,
                            textDecoration: isDoneGroup ? "line-through" : "none",
                          }}>
                            {rule.title_en}
                          </h3>
                          <span style={{
                            flexShrink: 0, padding: "3px 10px", borderRadius: 9999,
                            fontSize: 10, fontWeight: 800, letterSpacing: "0.05em",
                            background: sev.bg, color: sev.fg,
                          }}>
                            {SEVERITY_LABEL[rule.severity]}
                          </span>
                        </div>

                        <p style={{
                          fontFamily: font.body, fontSize: 13, fontWeight: 400, lineHeight: 1.6,
                          color: c.onSurfaceVariant, margin: "0 0 14px",
                        }}>
                          {rule.summary_en}
                        </p>

                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                          <span className="mso" aria-hidden="true" style={{ fontSize: 15, color: c.outline }}>event</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: c.onSurfaceVariant }}>
                            {item.due_date ? formatDue(item.due_date) : "No date yet"}
                          </span>
                          {!isDoneGroup && (
                            <span style={{
                              fontSize: 12, fontWeight: 700,
                              color: group === "overdue" ? c.error : c.onSurfaceVariant,
                            }}>
                              · {relativeDue(item.due_date, today)}
                            </span>
                          )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          {rule.official_url && (
                            <a
                              href={rule.official_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="tap-shrink"
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                padding: "9px 14px", borderRadius: 9999,
                                background: c.surfaceLow, color: c.primary,
                                fontSize: 12, fontWeight: 700, textDecoration: "none",
                              }}
                            >
                              Official info
                              <span className="mso" aria-hidden="true" style={{ fontSize: 14 }}>open_in_new</span>
                            </a>
                          )}

                          {tool && !isDoneGroup && (
                            <Link
                              href={tool.href}
                              className="tap-shrink"
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                padding: "9px 14px", borderRadius: 9999,
                                background: c.surfaceLow, color: c.primary,
                                fontSize: 12, fontWeight: 700, textDecoration: "none",
                              }}
                            >
                              <span className="mso" aria-hidden="true" style={{ fontSize: 14 }}>{tool.icon}</span>
                              {tool.label}
                            </Link>
                          )}

                          {isDoneGroup ? (
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              fontSize: 12, fontWeight: 700, color: c.success,
                            }}>
                              <span className="mso mso-fill" aria-hidden="true" style={{ fontSize: 15 }}>check_circle</span>
                              {item.status === "skipped" ? "Skipped" : "Done"}
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="tap-shrink"
                              onClick={() => markDone(item)}
                              disabled={isPending}
                              style={{
                                marginLeft: "auto", padding: "9px 16px", borderRadius: 9999,
                                border: "none", cursor: isPending ? "default" : "pointer",
                                fontFamily: font.headline, fontSize: 12, fontWeight: 800,
                                background: `${c.primary}12`, color: c.primary,
                                opacity: isPending ? 0.5 : 1, transition: "opacity 0.2s",
                                display: "inline-flex", alignItems: "center", gap: 5,
                              }}
                            >
                              <span className="mso" aria-hidden="true" style={{ fontSize: 15 }}>check</span>
                              Mark done
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div style={{ marginTop: 32 }}>
          <SettleDisclaimer />
        </div>
      </main>
    </div>
  );
}
