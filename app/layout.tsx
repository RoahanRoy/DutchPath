import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ToastContainer } from "@/components/ui/toast-container";

export const metadata: Metadata = {
  title: "DutchPath — Learn Dutch for Inburgering",
  description:
    "A Duolingo-inspired progressive learning platform for the Dutch Inburgering (civic integration) exam. Starting at A2 level.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(t==null&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})()` }} />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]" style={{ transition: "background-color 0.3s, color 0.3s" }}>
        <Providers>
          {children}
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
