import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

/**
 * The public, unauthenticated shell. This is the acquisition layer's layout, and
 * it is a sibling of (app) — it shares only the root layout.
 *
 * Hard rules for everything in this route group:
 *
 *  1. NO auth. Nothing here — layout or page — may call getClaims(), getProfile()
 *     or cookies(). In practice that reduces to a single invariant, because
 *     lib/supabase/server.ts is the only module in the codebase that touches
 *     `next/headers`: no file under app/(marketing) may import from it. Break
 *     that and these routes stop being statically rendered, silently.
 *
 *  2. NO (app) chrome. No TopNav, no MobileNav, no InstallPrompt, and above all
 *     no ProfileHydrator — the (app) layout's getProfile() call is exactly what
 *     makes those routes dynamic.
 *
 *  3. NO Zustand. Nothing here reads the profile store; there is no profile.
 *
 * `lang="en"` because the root layout hardcodes <html lang="nl"> and a route
 * group cannot override it. The app teaches Dutch; this content is English, and
 * telling a crawler otherwise is a real SEO error.
 *
 * Colours come from the CSS variables in globals.css rather than
 * getColors(isDark): useTheme() reports light on its first render, so on a page
 * that is served as static HTML an inline-styled shell would flash light before
 * hydration. The variables are already correct — the pre-paint script in
 * app/layout.tsx sets the `dark` class before first paint.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      lang="en"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--background)",
        color: "var(--on-surface)",
      }}
    >
      <MarketingHeader />
      <main style={{ flex: 1 }} id="main-content">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
