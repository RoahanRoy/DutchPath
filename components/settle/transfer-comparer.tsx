"use client";

import Link from "next/link";
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { SettleDisclaimer } from "@/components/settle-disclaimer";
import { useTheme, getColors, type Palette } from "@/lib/use-theme";
import { Card, Chip, Display, Kicker, Segmented, iconButton, secondaryButton, tones } from "@/components/ui/screen";
import {
  AMOUNT_LIMITS,
  DEFAULT_TRANSFER_INITIAL,
  LRS_RULES,
  MARKUP_LADDER_PCT,
  NRI_RULES,
  TCS_PURPOSE_LABEL,
  TRANSFER_VERIFIED_ON,
  convert,
  evaluateQuote,
  flipAmount,
  indianFinancialYear,
  rankQuotes,
  sourceCurrency,
  targetCurrency,
  tcsFor,
  transferInitialFrom,
  type Currency,
  type Direction,
  type MidRate,
  type QuoteResult,
  type TcsPurpose,
  type TransferInitial,
} from "@/lib/settle/transfer-data";

const font = {
  headline: "'Instrument Sans', system-ui, sans-serif",
  body: "'Instrument Serif', Georgia, serif",
};

const MAX_QUOTES = 5;

const ECB_URL =
  "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/eurofxref-graph-inr.en.html";

/* ── Formatting. Rupees in Indian grouping (₹1,08,124), euros in British
      (€1,000.50): both use a decimal point, so a rate typed as 108.12 reads the
      same way it is shown. ──────────────────────────────────────────────────── */

const inr0 = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const eur0 = new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eur2 = new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** `precise` keeps euro cents on large sums too — a quote's €1,006.68 total
 *  must not round to a figure the fee no longer adds up to. */
function money(cur: Currency, n: number, precise = false): string {
  if (cur === "INR") return inr0.format(n);
  return precise || Math.abs(n) < 1000 ? eur2.format(n) : eur0.format(n);
}

/** Where a quote's cost sits: in the rate, in the fee, or split between them. */
function costSplit(markupPct: number, fee: number): string {
  if (fee <= 0) return "all of it in the rate";
  if (markupPct < 0.005) return "all of it in the fee";
  return `${pct(markupPct)} in the rate, the rest in the fee`;
}

function rate(n: number): string {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(n: number): string {
  return `${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function formatDay(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  });
}

/** "₹10 lakh" rather than "₹10,00,000" where the rule itself is spoken of. */
function lakh(n: number): string {
  return n % 100_000 === 0 ? `₹${(n / 100_000).toLocaleString("en-IN")} lakh` : inr0.format(n);
}

const SYMBOL: Record<Currency, string> = { EUR: "€", INR: "₹" };

type QuoteDraft = { id: string; label: string; rate: string; fee: string };

/** Quote A, B, C… — the placeholder name, and the label when none is typed. */
const letter = (i: number) => String.fromCharCode(65 + i);

const blankQuotes = (): QuoteDraft[] => [
  { id: "q0", label: "", rate: "", fee: "" },
  { id: "q1", label: "", rate: "", fee: "" },
];

/* ── Small pieces. At module scope: a component created during render remounts
      on every keystroke (see components/settle/ruling-flow.tsx). ─────────── */

function fieldStyle(c: Palette, big = false): CSSProperties {
  return {
    width: "100%", minWidth: 0, boxSizing: "border-box",
    padding: big ? "13px 15px" : "10px 12px", borderRadius: big ? 14 : 11,
    border: `1.5px solid ${c.line}`, background: c.card2,
    fontSize: big ? 20 : 15, fontWeight: big ? 700 : 600, fontFamily: font.headline,
    color: c.ink, outline: "none", fontVariantNumeric: "tabular-nums",
  };
}

function SmallLabel({ htmlFor, children, c }: { htmlFor: string; children: ReactNode; c: Palette }) {
  return (
    <label htmlFor={htmlFor} style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: c.ink45, marginBottom: 5 }}>
      {children}
    </label>
  );
}

function Bullet({ icon, children, c }: { icon: string; children: ReactNode; c: Palette }) {
  return (
    <li style={{ display: "flex", gap: 10, fontSize: 13, fontWeight: 500, color: c.ink70, lineHeight: 1.55 }}>
      <span className="mso" aria-hidden="true" style={{ fontSize: 17, color: c.ink45, flexShrink: 0, marginTop: 1 }}>
        {icon}
      </span>
      <span style={{ minWidth: 0 }}>{children}</span>
    </li>
  );
}

function SourceLinks({ sources, c }: { sources: { label: string; url: string }[]; c: Palette }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 10 }}>
      {sources.map((s) => (
        <a
          key={s.url}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 600, color: c.co, textDecoration: "none" }}
        >
          {s.label}
          <span className="mso" aria-hidden="true" style={{ fontSize: 13 }}>open_in_new</span>
        </a>
      ))}
    </div>
  );
}

function QuoteRow({
  r,
  rank,
  best,
  dir,
  mid,
  c,
}: {
  r: QuoteResult;
  rank: number | null;
  best: boolean;
  dir: Direction;
  mid: MidRate | null;
  c: Palette;
}) {
  const src = sourceCurrency(dir);
  const tgt = targetCurrency(dir);
  const t = tones(c);
  return (
    <li
      style={{
        display: "flex", gap: 12, padding: 14, borderRadius: 14,
        background: best ? c.grSoft : c.card2,
        border: `1px solid ${best ? c.gr : c.line2}`,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          flex: "none", width: 26, height: 26, borderRadius: 9999, marginTop: 1,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12.5, fontWeight: 700,
          background: best ? c.gr : c.sunk, color: best ? "#fff" : c.ink70,
        }}
      >
        {rank ?? "–"}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: best ? c.grInk : c.ink, overflowWrap: "anywhere" }}>
            {r.label}
          </span>
          {best && <Chip fg={c.grInk} bg={c.card}>Best of these</Chip>}
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: best ? c.grInk : c.ink70, marginTop: 6, lineHeight: 1.5 }}>
          Recipient gets{" "}
          <strong style={{ fontSize: 15, fontWeight: 700, color: best ? c.grInk : c.ink, fontVariantNumeric: "tabular-nums" }}>
            {money(tgt, r.received, true)}
          </strong>
        </div>
        <div style={{ fontSize: 12, fontWeight: 500, color: best ? c.grInk : c.ink45, marginTop: 3, lineHeight: 1.5, fontVariantNumeric: "tabular-nums" }}>
          {rate(r.rate)} per €1
          {r.fee > 0 && <> · you pay {money(src, r.paid, true)} with the {money(src, r.fee, true)} fee</>}
        </div>
        {r.vsMid && !r.implausible && (
          <div style={{ fontSize: 12, fontWeight: 600, color: best ? c.grInk : c.ink70, marginTop: 3, lineHeight: 1.5, fontVariantNumeric: "tabular-nums" }}>
            {r.vsMid.totalCost >= 0 ? (
              <>
                Costs {money(src, r.vsMid.totalCost, true)} ({pct(r.vsMid.totalCostPct)}) against the reference
                rate — {costSplit(r.vsMid.markupPct, r.fee)}
              </>
            ) : (
              <>Better than the reference rate — check the quote is still live</>
            )}
          </div>
        )}
        {!r.vsMid && (
          <div style={{ fontSize: 12, fontWeight: 600, color: c.ink70, marginTop: 3, fontVariantNumeric: "tabular-nums" }}>
            {dir === "nl-in"
              ? `${rate(r.effectiveRate)} arrives per €1 you pay`
              : `€${(r.effectiveRate * 100_000).toLocaleString("en-GB", { maximumFractionDigits: 2 })} arrives per ₹1 lakh you pay`}
          </div>
        )}
        {r.implausible && (
          <div style={{ display: "flex", gap: 6, marginTop: 6, fontSize: 12, fontWeight: 600, color: t.rd.ink, lineHeight: 1.45 }}>
            <span className="mso" aria-hidden="true" style={{ fontSize: 15, color: t.rd.fg, flexShrink: 0, marginTop: 1 }}>warning</span>
            <span>
              That rate looks off, so it isn&apos;t ranked. Enter it as rupees per euro
              {mid ? `, near ${rate(mid.inrPerEur)}` : ""}.
            </span>
          </div>
        )}
      </div>
    </li>
  );
}

/* ── The comparer ──────────────────────────────────────────────────────────── */

/**
 * The India–Netherlands transfer comparer, shared by the public page at
 * /send-money-india and the signed-in one at /settle/send-money.
 *
 * Imports no Supabase client and stores nothing. The only outside figure is
 * `mid`, the ECB reference rate the server fetched (lib/settle/transfers.ts);
 * everything else is the user's own quotes, run through the pure functions in
 * lib/settle/transfer-data.ts. Nothing ranks a provider the user did not type.
 */
export function TransferComparer({
  initial = DEFAULT_TRANSFER_INITIAL,
  mid,
  asOf,
  backLink,
  footer,
}: {
  initial?: TransferInitial;
  /** The ECB rate, or null when it could not be loaded. */
  mid: MidRate | null;
  /** Today in Amsterdam (YYYY-MM-DD), from the server: picks the Indian
   *  financial year, and keeps server and client agreeing on it. */
  asOf: string;
  backLink?: { href: string; label: string };
  /** Rendered before the disclaimer — route-specific links. */
  footer?: ReactNode;
}) {
  const { isDark } = useTheme();
  const c = getColors(isDark);
  const t = tones(c);

  const [dir, setDir] = useState<Direction>(initial.direction);
  const [amountText, setAmountText] = useState(String(initial.amount));
  const [quotes, setQuotes] = useState<QuoteDraft[]>(blankQuotes);
  const nextId = useRef(2);
  const [sender, setSender] = useState<"nri" | "resident">("resident");
  const [purpose, setPurpose] = useState<TcsPurpose>("other");
  const [alreadyText, setAlreadyText] = useState("");

  const src = sourceCurrency(dir);
  const tgt = targetCurrency(dir);
  const limits = AMOUNT_LIMITS[src];
  const amount = Number(amountText);
  const amountOk = Number.isFinite(amount) && amount > 0;
  const midRate = mid?.inrPerEur ?? null;

  const changeDir = (next: Direction) => {
    if (next === dir) return;
    setAmountText(String(flipAmount(dir, amountOk ? amount : 0, midRate)));
    // A quote for selling euros says nothing about buying them, and the fee
    // currency flips too — start the comparison over.
    setQuotes(blankQuotes());
    setDir(next);
  };

  const updateQuote = (id: string, patch: Partial<QuoteDraft>) =>
    setQuotes((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  const addQuote = () => {
    if (quotes.length >= MAX_QUOTES) return;
    const id = `q${nextId.current++}`;
    setQuotes((qs) => [...qs, { id, label: "", rate: "", fee: "" }]);
  };

  const removeQuote = (id: string) => setQuotes((qs) => qs.filter((q) => q.id !== id));

  // Evaluate every quote with a usable rate; rank only the plausible ones.
  const evaluated = amountOk
    ? quotes.flatMap((q, i) => {
        const r = Number(q.rate);
        if (!q.rate.trim() || !Number.isFinite(r) || r <= 0) return [];
        const fee = Number(q.fee);
        return [
          evaluateQuote(
            dir,
            amount,
            { id: q.id, label: q.label.trim() || `Provider ${letter(i)}`, rate: r, fee: Number.isFinite(fee) ? fee : 0 },
            midRate
          ),
        ];
      })
    : [];
  const ranked = rankQuotes(evaluated.filter((r) => !r.implausible));
  const unranked = evaluated.filter((r) => r.implausible);

  // India → NL, sent by a resident of India: LRS and TCS.
  const fy = indianFinancialYear(asOf);
  const lrs = LRS_RULES[fy.label] ?? null;
  const already = Number(alreadyText);
  const tcs =
    dir === "in-nl" && amountOk
      ? tcsFor({ amountInr: amount, alreadySentInr: Number.isFinite(already) ? already : 0, purpose, isoDate: asOf })
      : null;

  return (
    <div style={{ color: c.ink, fontFamily: font.headline }}>
      <div style={{ padding: "24px 20px 128px", maxWidth: 560, margin: "0 auto" }}>
        {backLink && (
          <Link
            href={backLink.href}
            className="tap-shrink"
            style={{
              display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 20,
              fontSize: 13, fontWeight: 700, color: c.ink70, textDecoration: "none",
            }}
          >
            <span className="mso" aria-hidden="true" style={{ fontSize: 18 }}>arrow_back</span>
            {backLink.label}
          </Link>
        )}

        <header className="fm-fade-up" style={{ marginBottom: 22 }}>
          <Kicker c={c} color={c.co}>Money transfer · Netherlands ⇄ India</Kicker>
          <Display c={c} style={{ marginTop: 10 }}>
            {dir === "nl-in" ? "Send money to India" : "Send money from India"}
          </Display>
          <p style={{ fontSize: 14, fontWeight: 500, color: c.ink70, lineHeight: 1.6, margin: "10px 0 0" }}>
            See what a bank or transfer service really charges: its fee, plus the markup
            hidden in its exchange rate, measured against the ECB reference rate. Rank your
            quotes by what actually arrives.
          </p>
        </header>

        {/* ── Direction, amount, reference rate ───────────────────────────── */}
        <Card c={c} className="fm-fade-up" style={{ padding: 18, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <label htmlFor="transfer-amount" style={{ fontSize: 14, fontWeight: 700, color: c.ink }}>
              You send
            </label>
            <Segmented
              c={c}
              label="Direction"
              value={dir}
              onChange={changeDir}
              options={[
                { value: "nl-in", label: "NL → India" },
                { value: "in-nl", label: "India → NL" },
              ]}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: c.ink45 }}>{SYMBOL[src]}</span>
            <input
              id="transfer-amount"
              type="number"
              inputMode="decimal"
              min={limits.min}
              max={limits.max}
              step={limits.step}
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
              style={{ ...fieldStyle(c, true), flex: 1 }}
            />
          </div>

          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${c.line2}` }}>
            {mid ? (
              <div style={{ display: "flex", gap: 12 }}>
                <span
                  style={{
                    flex: "none", width: 36, height: 36, borderRadius: 12, background: c.coSoft,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <span className="mso" aria-hidden="true" style={{ fontSize: 19, color: c.co }}>currency_exchange</span>
                </span>
                <div style={{ minWidth: 0 }}>
                  <Kicker c={c}>ECB reference rate · {formatDay(mid.date)}</Kicker>
                  <div style={{ fontFamily: font.body, fontSize: 26, lineHeight: 1.15, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                    €1 = {rate(mid.inrPerEur)}
                  </div>
                  {amountOk && (
                    <p style={{ margin: "4px 0 0", fontSize: 12.5, fontWeight: 500, color: c.ink70, lineHeight: 1.5 }}>
                      {money(src, amount)} is{" "}
                      <strong style={{ color: c.ink, fontVariantNumeric: "tabular-nums" }}>
                        {money(tgt, convert(dir, amount, mid.inrPerEur))}
                      </strong>{" "}
                      at this rate — what would arrive with no markup and no fee.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p style={{
                display: "flex", gap: 8, margin: 0, padding: "10px 12px", borderRadius: 12,
                background: t.or.bg, color: t.or.ink, fontSize: 12.5, fontWeight: 500, lineHeight: 1.5,
              }}>
                <span className="mso" aria-hidden="true" style={{ fontSize: 16, flexShrink: 0, color: t.or.fg }}>info</span>
                The ECB reference rate couldn&apos;t be loaded just now. Quotes are still ranked
                against each other; their cost against the reference rate comes back with it.
              </p>
            )}
          </div>
        </Card>

        {/* ── Your quotes ─────────────────────────────────────────────────── */}
        <Card c={c} className="fm-fade-up" style={{ padding: 18, marginBottom: 16 }}>
          <Kicker c={c}>Compare your quotes</Kicker>
          <p style={{ fontSize: 13, fontWeight: 500, color: c.ink70, lineHeight: 1.55, margin: "8px 0 14px" }}>
            Ask each provider — your bank&apos;s app, a transfer service — for a quote on{" "}
            {amountOk ? money(src, amount) : "the same amount"}, and copy in its exchange rate
            and fee.{" "}
            {dir === "in-nl"
              ? "Count everything charged on top: transfer fee, GST on the conversion, SWIFT charges."
              : "Count everything charged on top of the amount, including any SWIFT charge."}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {quotes.map((q, i) => (
              <fieldset
                key={q.id}
                style={{ margin: 0, padding: 12, border: `1px solid ${c.line}`, borderRadius: 14, minWidth: 0 }}
              >
                <legend style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                  Quote {letter(i)}
                </legend>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="text"
                    aria-label={`Quote ${letter(i)}: provider name`}
                    placeholder={`Provider ${letter(i)}`}
                    maxLength={40}
                    value={q.label}
                    onChange={(e) => updateQuote(q.id, { label: e.target.value })}
                    style={{ ...fieldStyle(c), flex: 1, fontSize: 14 }}
                  />
                  {quotes.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Remove quote ${letter(i)}`}
                      onClick={() => removeQuote(q.id)}
                      className="tap-shrink"
                      style={iconButton(c, 34)}
                    >
                      <span className="mso" aria-hidden="true" style={{ fontSize: 17, color: c.ink45 }}>close</span>
                    </button>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginTop: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <SmallLabel c={c} htmlFor={`${q.id}-rate`}>Rate, ₹ per €1</SmallLabel>
                    <input
                      id={`${q.id}-rate`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      placeholder={midRate ? midRate.toFixed(2) : "108.00"}
                      value={q.rate}
                      onChange={(e) => updateQuote(q.id, { rate: e.target.value })}
                      style={fieldStyle(c)}
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <SmallLabel c={c} htmlFor={`${q.id}-fee`}>Fee, {SYMBOL[src]}</SmallLabel>
                    <input
                      id={`${q.id}-fee`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={src === "EUR" ? "0.01" : "1"}
                      placeholder="0"
                      value={q.fee}
                      onChange={(e) => updateQuote(q.id, { fee: e.target.value })}
                      style={fieldStyle(c)}
                    />
                  </div>
                </div>
              </fieldset>
            ))}
          </div>

          {quotes.length < MAX_QUOTES && (
            <button
              type="button"
              onClick={addQuote}
              className="tap-shrink"
              style={{
                ...secondaryButton(c, { compact: true }),
                marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <span className="mso" aria-hidden="true" style={{ fontSize: 17 }}>add</span>
              Add another quote
            </button>
          )}

          {(ranked.length > 0 || unranked.length > 0) && (
            <section aria-label="Ranked quotes" style={{ marginTop: 18 }}>
              <Kicker c={c}>Ranked by what arrives</Kicker>
              <ol style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {ranked.map((r, i) => (
                  <QuoteRow key={r.id} r={r} rank={i + 1} best={i === 0 && ranked.length > 1} dir={dir} mid={mid} c={c} />
                ))}
                {unranked.map((r) => (
                  <QuoteRow key={r.id} r={r} rank={null} best={false} dir={dir} mid={mid} c={c} />
                ))}
              </ol>
            </section>
          )}
        </Card>

        {/* ── India → NL: who is sending ──────────────────────────────────── */}
        {dir === "in-nl" && (
          <Card c={c} className="fm-fade-up" style={{ padding: 18, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: c.ink }}>Who is sending?</span>
              <Segmented
                c={c}
                label="Who is sending"
                value={sender}
                onChange={setSender}
                options={[
                  { value: "resident", label: "Family in India" },
                  { value: "nri", label: "Me, from NL" },
                ]}
              />
            </div>

            {sender === "nri" ? (
              <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                <Bullet c={c} icon="flight_takeoff">
                  Once you&apos;ve moved abroad for work you&apos;re usually a non-resident (NRI)
                  under India&apos;s foreign-exchange rules. The LRS limit and TCS apply to
                  residents of India, not to you.
                </Bullet>
                <Bullet c={c} icon="account_balance">
                  <strong style={{ color: c.ink }}>NRE account</strong> — money earned abroad.
                  Balance and interest can be sent back out freely.
                </Bullet>
                <Bullet c={c} icon="account_balance_wallet">
                  <strong style={{ color: c.ink }}>NRO account</strong> — money from India: rent,
                  dividends, savings from before you left. Up to USD{" "}
                  {NRI_RULES.nroLimitUsd.toLocaleString("en-GB")} per financial year can be sent
                  abroad, once Indian tax on it is settled.
                </Bullet>
                <Bullet c={c} icon="swap_horiz">
                  Still have a resident savings account? RBI rules say it should be re-designated
                  as an NRO account once you become non-resident — tell your bank.
                </Bullet>
                <Bullet c={c} icon="description">
                  For NRO transfers the bank asks for tax paperwork: a remittance declaration and
                  often a chartered accountant&apos;s certificate (long known as Forms 15CA and 15CB).
                </Bullet>
                <li><SourceLinks c={c} sources={[NRI_RULES.source]} /></li>
              </ul>
            ) : (
              <div style={{ marginTop: 14 }}>
                <SmallLabel c={c} htmlFor="tcs-purpose">What is it for?</SmallLabel>
                <select
                  id="tcs-purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value as TcsPurpose)}
                  style={{ ...fieldStyle(c), fontSize: 14, colorScheme: isDark ? "dark" : "light" }}
                >
                  {(Object.keys(TCS_PURPOSE_LABEL) as TcsPurpose[]).map((p) => (
                    <option key={p} value={p}>{TCS_PURPOSE_LABEL[p]}</option>
                  ))}
                </select>

                <div style={{ marginTop: 12 }}>
                  <SmallLabel c={c} htmlFor="tcs-already">
                    Already sent abroad under LRS since 1 April {fy.startsOn.slice(0, 4)}, ₹
                  </SmallLabel>
                  <input
                    id="tcs-already"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={10_000}
                    placeholder="0"
                    value={alreadyText}
                    onChange={(e) => setAlreadyText(e.target.value)}
                    style={fieldStyle(c)}
                  />
                </div>

                {!lrs ? (
                  <p style={{
                    display: "flex", gap: 8, margin: "14px 0 0", padding: "10px 12px", borderRadius: 12,
                    background: t.or.bg, color: t.or.ink, fontSize: 12.5, fontWeight: 500, lineHeight: 1.5,
                  }}>
                    <span className="mso" aria-hidden="true" style={{ fontSize: 16, flexShrink: 0, color: t.or.fg }}>schedule</span>
                    The TCS rates for FY {fy.label} haven&apos;t been checked here yet, so no figure is
                    shown. Ask the sender&apos;s bank.
                  </p>
                ) : tcs && (
                  <div style={{
                    marginTop: 14, padding: "12px 14px", borderRadius: 14,
                    background: tcs.tcsInr > 0 ? t.or.bg : t.gr.bg,
                    color: tcs.tcsInr > 0 ? t.or.ink : t.gr.ink,
                  }}>
                    <Kicker c={c} color={tcs.tcsInr > 0 ? t.or.ink : t.gr.ink}>
                      TCS on this transfer · FY {fy.label}
                    </Kicker>
                    <div style={{ fontFamily: font.body, fontSize: 28, lineHeight: 1.1, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
                      {inr0.format(tcs.tcsInr)}
                    </div>
                    <p style={{ margin: "6px 0 0", fontSize: 12.5, fontWeight: 500, lineHeight: 1.5 }}>
                      {tcs.ratePct === 0
                        ? "None: education paid from a loan from a financial institution carries no TCS at any amount."
                        : tcs.aboveThresholdInr === 0
                          ? `None: this stays under the ${lakh(tcs.thresholdInr)} threshold, with ${inr0.format(tcs.headroomInr - amount)} of it left this financial year.`
                          : `${tcs.ratePct}% of the ${inr0.format(tcs.aboveThresholdInr)} above the ${lakh(tcs.thresholdInr)} threshold. The bank collects it on top, so ${inr0.format(amount + tcs.tcsInr)} leaves the account before fees.`}
                    </p>
                  </div>
                )}

                <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  <Bullet c={c} icon="receipt_long">
                    TCS isn&apos;t a fee. It&apos;s income tax collected in advance: it shows up in the
                    sender&apos;s annual tax statement and counts against their tax for the year, or
                    comes back as a refund when they file.
                  </Bullet>
                  {lrs && (
                    <Bullet c={c} icon="person">
                      The Liberalised Remittance Scheme lets each resident send up to USD{" "}
                      {lrs.limitUsd.toLocaleString("en-GB")} abroad per financial year
                      (1 April – 31 March). Each family member has their own limit.
                    </Bullet>
                  )}
                  <Bullet c={c} icon="help">
                    Ask the bank how it counts transfers made through other banks towards the{" "}
                    {lrs ? lakh(lrs.tcsThresholdInr) : "TCS"} threshold.
                  </Bullet>
                </ul>
                {lrs && (
                  <>
                    <div style={{ marginTop: 12 }}>
                      <Chip fg={c.ink70} bg={c.card2} style={{ display: "inline-block", whiteSpace: "normal", lineHeight: 1.4 }}>
                        Checked against RBI and Budget 2026 sources on {formatDay(TRANSFER_VERIFIED_ON)}
                      </Chip>
                    </div>
                    <SourceLinks c={c} sources={lrs.sources} />
                  </>
                )}
              </div>
            )}
          </Card>
        )}

        {/* ── What a markup costs ─────────────────────────────────────────── */}
        {mid && amountOk && (
          <Card c={c} className="fm-fade-up" style={{ padding: "6px 16px 14px", marginBottom: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontVariantNumeric: "tabular-nums" }}>
              <caption style={{ textAlign: "left", padding: "12px 0 6px" }}>
                <Kicker c={c}>What a markup costs on {money(src, amount)}</Kicker>
              </caption>
              <thead>
                <tr>
                  {["Markup", "Costs you", "Recipient gets"].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      style={{
                        textAlign: i === 0 ? "left" : "right", padding: "6px 0 6px", paddingLeft: i === 0 ? 0 : 10,
                        fontSize: 11, fontWeight: 700, color: c.ink45, textTransform: "uppercase", letterSpacing: "0.08em",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MARKUP_LADDER_PCT.map((m) => (
                  <tr key={m} style={{ borderTop: `1px solid ${c.line2}` }}>
                    <th scope="row" style={{ textAlign: "left", padding: "9px 0", fontSize: 12.5, fontWeight: 600, color: c.ink70 }}>
                      {m.toLocaleString("en-GB")}%
                    </th>
                    <td style={{ textAlign: "right", padding: "9px 0 9px 10px", fontSize: 12.5, fontWeight: 600, color: c.ink, whiteSpace: "nowrap" }}>
                      {money(src, (amount * m) / 100)}
                    </td>
                    <td style={{ textAlign: "right", padding: "9px 0 9px 10px", fontSize: 12.5, fontWeight: 600, color: c.ink, whiteSpace: "nowrap" }}>
                      {money(tgt, convert(dir, amount, mid.inrPerEur) * (1 - m / 100))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* ── Reading a quote ─────────────────────────────────────────────── */}
        <Card c={c} tone="sunken" style={{ padding: 16, marginBottom: 16 }}>
          <Kicker c={c}>Reading a quote</Kicker>
          <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            <Bullet c={c} icon="visibility_off">
              The rate is where most of the cost hides. Few providers state their markup, so set
              their rate against the reference rate above.
            </Bullet>
            <Bullet c={c} icon="straighten">
              Ask everyone for the same amount — rates and fees often change with the size of
              the transfer.
            </Bullet>
            <Bullet c={c} icon="account_balance">
              On a SWIFT transfer an intermediary or the receiving bank can deduct a charge on
              the way, so slightly less may arrive than quoted.
            </Bullet>
            <Bullet c={c} icon="schedule">
              The ECB publishes its rate once each working day, around 16:00 CET. Live rates move
              during the day, so a gap of a fraction of a percent can just be timing.
            </Bullet>
          </ul>
        </Card>

        {footer}

        <div style={{ marginTop: 16 }}>
          <SettleDisclaimer
            officialUrl={dir === "in-nl" ? "https://rbi.org.in/Scripts/FAQView.aspx?Id=115" : ECB_URL}
            officialLabel={dir === "in-nl" ? "rbi.org.in" : "ecb.europa.eu"}
            body="Not financial or tax advice. The reference rate is the European Central Bank's daily euro rate, served by the open Frankfurter API; no provider is likely to give you exactly that rate. DutchPath ranks only the quotes you enter. It has no tie to any bank or transfer service and earns nothing from where you send money. The Indian rules shown (LRS, TCS, NRO limits) are summarised from RBI and Budget 2026 sources — confirm with the bank before you send."
          />
        </div>
      </div>
    </div>
  );
}

/**
 * The public route's entry point: reads `?dir=&amount=` from the query string.
 * Must sit inside a <Suspense> — see NetPayCalculatorFromUrl.
 */
export function TransferComparerFromUrl(props: Omit<Parameters<typeof TransferComparer>[0], "initial">) {
  const params = useSearchParams();
  return <TransferComparer {...props} initial={transferInitialFrom((k) => params.get(k))} />;
}
