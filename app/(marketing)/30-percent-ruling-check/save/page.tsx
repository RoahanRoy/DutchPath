import type { Metadata } from "next";
import { SaveClient } from "./save-client";

/**
 * Lands a held anonymous check after sign-in, writes it, and forwards to
 * /settle. Statically rendered — the session is read in the browser, not here.
 *
 * Excluded from the sitemap and disallowed in robots.txt: it is a step in a
 * flow, not a page anyone should arrive at from search.
 */
export const metadata: Metadata = {
  title: "Saving your result — DutchPath",
  robots: { index: false, follow: false },
};

export default function SaveRulingCheckPage() {
  return <SaveClient />;
}
