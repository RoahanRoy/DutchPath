import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ToastContainer } from "@/components/ui/toast-container";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { ThemeColorSync } from "@/components/pwa/theme-color-sync";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  // Lets the marketing routes declare relative canonicals and lets the OG image
  // resolve to an absolute URL. Set NEXT_PUBLIC_SITE_URL in Vercel; see lib/site.
  metadataBase: new URL(SITE_URL),
  title: "DutchPath — Learn Dutch for Inburgering",
  description:
    "A Duolingo-inspired progressive learning platform for the Dutch Inburgering (civic integration) exam. Starting at A2 level.",
  applicationName: "DutchPath",
  icons: {
    icon: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // Read only by iOS when launched from the home screen: drops the Safari
  // chrome and names the icon. No effect in a browser tab.
  appleWebApp: {
    capable: true,
    title: "DutchPath",
    statusBarStyle: "default",
  },
  verification: { google: "NyMm56XbiO1tICxdldg03mNF0T4Y-kxGxU8yUT1WwMs" },
};

export const viewport: Viewport = {
  // Colours the iOS status bar in the installed app and the Android address
  // bar. <ThemeColorSync> repoints these when the in-app toggle disagrees with
  // the OS preference.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#121413" },
  ],
  // Lets the layout run edge-to-edge under the notch and home indicator. Safe
  // areas are paid back as padding in globals.css and the mobile nav.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* `appleWebApp.capable` emits only the standard
            `mobile-web-app-capable`, which iOS understands from 15.4 onwards.
            Emitting the legacy spelling too keeps older iOS launching
            standalone rather than in a Safari tab. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link
          rel="preload"
          href="/fonts/material-symbols-outlined.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(t==null&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})()` }} />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]" style={{ transition: "background-color 0.3s, color 0.3s" }}>
        <Providers>
          {children}
          <ToastContainer />
          <ThemeColorSync />
          <ServiceWorkerRegister />
        </Providers>
      </body>
    </html>
  );
}
