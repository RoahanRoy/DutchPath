"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SettleDisclaimer } from "@/components/settle-disclaimer";
import { useTheme, getColors, font } from "@/lib/use-theme";
import { Screen, Kicker, Display, Card, Chip, ProgressBar, screenTopPad } from "@/components/ui/screen";
import { getAmsterdamDate } from "@/lib/utils";
import type { Database, SettleRule, SettleSeverity, SettleTimelineItem } from "@/lib/supabase/types";

type TimelineUpdate = Database["public"]["Tables"]["settle_timeline_items"]["Update"];

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
    case "blocking": return { fg: c.rd, bg: c.rdSoft };
    case "costly": return { fg: c.or, bg: c.orSoft };
    case "routine": return { fg: c.ink70, bg: c.sunk };
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
  const [filter, setFilter] = useState<"open" | "done">("open");
  // Rows collapse to their title; the summary, dates and actions are one tap in.
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

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
  }))
    // The filter is a view over the same grouping, not a second source of
    // truth: "Open" simply drops the done group and vice versa.
    .filter((s) => s.rows.length > 0 && (filter === "open" ? s.group !== "done" : s.group === "done"));

  const openCount = total - doneCount;

  return (
    <Screen>
      <div style={{ padding: `${screenTopPad} 20px 16px` }} className="fm-fade-up">
        <Kicker c={c}>Settle · arrival stack</Kicker>
        <Display c={c} style={{ fontSize: 32, margin: "8px 0 14px" }}>
          Everything the<br />Netherlands <em>asks of you</em>
        </Display>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ProgressBar c={c} pct={pct} height={8} />
          <span style={{ fontSize: 12, fontWeight: 600, color: c.ink70, flex: "none" }}>
            {doneCount} of {total}
          </span>
        </div>
      </div>

      <div style={{ padding: "0 20px 10px", display: "flex", flexDirection: "column", gap: 16 }}>
        {error && (
          <div
            className="fm-fade-down"
            role="alert"
            style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              padding: "12px 14px", borderRadius: 14,
              background: c.rdSoft, color: c.rd,
              fontSize: 13, fontWeight: 600, lineHeight: 1.5,
            }}
          >
            <span className="mso" aria-hidden="true" style={{ fontSize: 18, flexShrink: 0 }}>error</span>
            {error}
          </div>
        )}

        {/* ── Open / Done ── */}
        {total > 0 && (
          <div style={{ display: "flex", gap: 6, background: c.sunk, padding: 4, borderRadius: 9999 }}>
            {([
              ["open", `Open · ${openCount}`],
              ["done", `Done · ${doneCount}`],
            ] as const).map(([value, label]) => {
              const on = filter === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  style={{
                    flex: 1, border: "none", cursor: "pointer", fontFamily: font.headline,
                    fontSize: 12.5, fontWeight: 600, padding: "9px 0", borderRadius: 9999,
                    background: on ? c.card : "transparent",
                    color: on ? c.ink : c.ink45,
                    boxShadow: on ? "0 1px 3px rgba(16,17,20,.08)" : "none",
                    transition: "background 0.2s, color 0.2s",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Empty: a profile exists but nothing was generated ── */}
        {total === 0 && (
          <Card c={c} className="fm-rise" style={{ padding: 22, textAlign: "center" }}>
            <span className="mso" aria-hidden="true" style={{ fontSize: 34, color: c.ink25 }}>inbox</span>
            <Display c={c} as="h2" style={{ fontSize: 22, margin: "12px 0 0" }}>
              Nothing on your timeline yet
            </Display>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: c.ink70, margin: "8px 0 0" }}>
              No rule currently in force applies to the details you gave. Reload the page
              after new guidance is added and anything relevant will appear here.
            </p>
          </Card>
        )}

        {/* ── All done ── */}
        {allDone && (
          <div className="fm-rise" style={{ background: c.grSoft, borderRadius: 22, padding: 22, textAlign: "center" }}>
            <span className="mso mso-fill" aria-hidden="true" style={{ fontSize: 34, color: c.gr }}>task_alt</span>
            <Display c={c} as="h2" style={{ fontSize: 22, margin: "12px 0 0" }}>
              Your arrival stack is clear
            </Display>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: c.ink70, margin: "8px 0 0" }}>
              All {total} steps are marked done. New deadlines appear here as your
              situation and the rules change.
            </p>
          </div>
        )}

        {/* ── Groups ── */}
        {grouped.map(({ group, rows: groupRows }) => {
          const meta = GROUP_META[group];
          const isDoneGroup = group === "done";
          const accent = group === "overdue" ? c.rd : group === "soon" ? c.co : c.ink45;

          return (
            <section key={group}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: accent }}>
                  {meta.title}
                </span>
                <span style={{ flex: 1, height: 1, background: c.line }} />
                <span style={{ fontSize: 10.5, fontWeight: 600, color: c.ink45, flex: "none" }}>
                  {groupRows.length}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {groupRows.map(({ item, rule }) => {
                  const sev = severityColors(rule.severity, c);
                  const isPending = !!pending[item.id];
                  const tool = TOOL_BY_RULE_KEY[rule.key];
                  const isOpen = !!expanded[item.id];
                  const overdue = group === "overdue";

                  return (
                    <div
                      key={item.id}
                      className="fm-fade-up"
                      style={{
                        border: `1px solid ${overdue ? c.rd : c.line2}`,
                        background: c.card,
                        borderRadius: 16,
                        overflow: "hidden",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setExpanded((e) => ({ ...e, [item.id]: !e[item.id] }))}
                        aria-expanded={isOpen}
                        style={{
                          textAlign: "left", width: "100%", border: "none", cursor: "pointer",
                          fontFamily: font.headline, background: "transparent",
                          padding: "15px 16px", display: "flex", alignItems: "center", gap: 11,
                        }}
                      >
                        <span
                          style={{
                            width: 7, height: 7, flex: "none", borderRadius: 9999,
                            background: isDoneGroup ? c.gr : overdue ? c.rd : group === "soon" ? c.or : c.ink25,
                          }}
                        />
                        <span
                          style={{
                            flex: 1, fontSize: 14.5, fontWeight: 600, color: c.ink, lineHeight: 1.35,
                            textDecoration: isDoneGroup ? "line-through" : "none",
                            opacity: isDoneGroup ? 0.65 : 1,
                          }}
                        >
                          {rule.title_en}
                        </span>
                        <span
                          className="mso"
                          aria-hidden="true"
                          style={{
                            fontSize: 19, color: c.ink25, flex: "none",
                            transform: isOpen ? "rotate(180deg)" : "none",
                            transition: "transform 0.2s",
                          }}
                        >
                          expand_more
                        </span>
                      </button>

                      {isOpen && (
                        <div style={{ padding: "0 16px 15px" }}>
                          <div style={{ fontFamily: font.body, fontSize: 15, lineHeight: 1.55, color: c.ink70 }}>
                            {rule.summary_en}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 12, flexWrap: "wrap" }}>
                            <Chip
                              fg={sev.fg}
                              bg={sev.bg}
                              style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "4px 9px" }}
                            >
                              {SEVERITY_LABEL[rule.severity]}
                            </Chip>
                            <span style={{ fontSize: 11.5, fontWeight: 600, color: c.ink70 }}>
                              {item.due_date ? formatDue(item.due_date) : "No date yet"}
                            </span>
                            {!isDoneGroup && (
                              <span style={{ fontSize: 11.5, fontWeight: 600, color: overdue ? c.rd : c.ink45 }}>
                                {relativeDue(item.due_date, today)}
                              </span>
                            )}
                          </div>

                          <div style={{ display: "flex", gap: 8, marginTop: 13, flexWrap: "wrap" }}>
                            {rule.official_url && (
                              <a
                                href={rule.official_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="tap-shrink"
                                style={{
                                  flex: 1, minWidth: 120, textAlign: "center",
                                  border: `1px solid ${c.line}`, background: c.card2, color: c.co,
                                  fontFamily: font.headline, fontSize: 13, fontWeight: 600,
                                  padding: "11px 0", borderRadius: 12, textDecoration: "none",
                                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
                                }}
                              >
                                Official info
                                <span className="mso" aria-hidden="true" style={{ fontSize: 15 }}>open_in_new</span>
                              </a>
                            )}

                            {tool && !isDoneGroup && (
                              <Link
                                href={tool.href}
                                className="tap-shrink"
                                style={{
                                  flex: 1, minWidth: 120, textAlign: "center",
                                  border: `1px solid ${c.line}`, background: c.card2, color: c.co,
                                  fontFamily: font.headline, fontSize: 13, fontWeight: 600,
                                  padding: "11px 0", borderRadius: 12, textDecoration: "none",
                                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
                                }}
                              >
                                <span className="mso" aria-hidden="true" style={{ fontSize: 15 }}>{tool.icon}</span>
                                {tool.label}
                              </Link>
                            )}

                            {isDoneGroup ? (
                              <span
                                style={{
                                  flex: 1, minWidth: 120,
                                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
                                  fontSize: 13, fontWeight: 600, color: c.gr,
                                  padding: "11px 0",
                                }}
                              >
                                <span className="mso mso-fill" aria-hidden="true" style={{ fontSize: 16 }}>check_circle</span>
                                {item.status === "skipped" ? "Skipped" : "Done"}
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="tap-shrink"
                                onClick={() => markDone(item)}
                                disabled={isPending}
                                style={{
                                  flex: 1, minWidth: 120,
                                  border: "none", cursor: isPending ? "default" : "pointer",
                                  fontFamily: font.headline, fontSize: 13, fontWeight: 600,
                                  background: c.co, color: "#fff",
                                  padding: "11px 0", borderRadius: 12,
                                  opacity: isPending ? 0.5 : 1, transition: "opacity 0.2s",
                                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
                                }}
                              >
                                <span className="mso" aria-hidden="true" style={{ fontSize: 16 }}>check</span>
                                Mark done
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* ── Tools ──
             A card rather than a row inside a group: the checker is not a
             deadline, and it stays reachable for users the 30% ruling rule
             never fires for (self-employed) or who already marked it done. */}
        <Link
          href="/settle/30-ruling"
          className="fm-fade-up tap-shrink"
          style={{
            display: "flex", alignItems: "center", gap: 13,
            border: `1px solid ${c.line}`, background: c.card2, borderRadius: 18, padding: 16,
            textDecoration: "none",
          }}
        >
          <span
            style={{
              flexShrink: 0, width: 40, height: 40, borderRadius: 13, background: c.coSoft,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <span className="mso" aria-hidden="true" style={{ fontSize: 20, color: c.co }}>calculate</span>
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: c.ink }}>
              30% ruling check
            </span>
            <span style={{ display: "block", fontSize: 12, lineHeight: 1.5, color: c.ink70, marginTop: 3 }}>
              A few questions against the Belastingdienst conditions. Guidance only —
              nothing is filed.
            </span>
          </span>
          <span className="mso" aria-hidden="true" style={{ fontSize: 20, color: c.ink25, flexShrink: 0 }}>
            chevron_right
          </span>
        </Link>

        <SettleDisclaimer />
      </div>
    </Screen>
  );
}
