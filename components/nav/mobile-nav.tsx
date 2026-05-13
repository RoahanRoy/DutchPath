"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { useTheme, getColors } from "@/lib/use-theme";

const NAV_ITEMS: {
  href: string;
  icon: string;
  label: string;
  hideWhen?: "writing_exam_completed" | "listening_exam_completed" | "knm_exam_completed" | "exam_completed";
  hideAtB1?: boolean;
}[] = [
  { href: "/dashboard", icon: "home", label: "Home" },
  { href: "/lessons", icon: "menu_book", label: "Lessons", hideWhen: "exam_completed" },
  { href: "/writing", icon: "edit_note", label: "Writing", hideWhen: "writing_exam_completed" },
  { href: "/listening", icon: "headphones", label: "Listening", hideWhen: "listening_exam_completed" },
  { href: "/knm", icon: "public", label: "KNM", hideWhen: "knm_exam_completed", hideAtB1: true },
  { href: "/vocabulary", icon: "format_list_bulleted", label: "Vocab" },
  { href: "/profile", icon: "person", label: "Profile" },
];

export function MobileNav() {
  const pathname = usePathname();
  const profile = useAppStore((s) => s.profile);
  const { isDark } = useTheme();
  const c = getColors(isDark);

  return (
    <nav
      style={{
        position: "fixed", bottom: 0, left: 0, width: "100%", zIndex: 50,
        display: "flex", justifyContent: "center", alignItems: "center",
        padding: "0 16px", paddingBottom: 32, height: 96, pointerEvents: "none",
      }}
      className="md:hidden"
      aria-label="Main navigation"
    >
      <div style={{
        background: isDark ? "rgba(26,28,27,0.6)" : c.glassBackground,
        backdropFilter: "blur(48px)", WebkitBackdropFilter: "blur(48px)",
        borderRadius: 9999, margin: "0 24px", height: 64, width: "100%",
        display: "flex", justifyContent: "space-around", alignItems: "center",
        boxShadow: isDark ? "0px 24px 48px rgba(0,0,0,0.4)" : "0px 12px 32px rgba(26,28,27,0.06)",
        pointerEvents: "auto",
        border: c.glassBorder !== "transparent" ? `1px solid ${c.glassBorder}` : "none",
        transition: "background 0.3s",
      }}>
        {NAV_ITEMS.filter(({ hideWhen, hideAtB1 }) => {
          if (!profile) return true;
          const p = profile as unknown as Record<string, unknown>;
          if (hideAtB1 && p.current_level === "B1") return false;
          if (!hideWhen) return true;
          const flag = p.current_level === "B1"
            ? ({ exam_completed: "b1_exam_completed", writing_exam_completed: "b1_writing_exam_completed", listening_exam_completed: "b1_listening_exam_completed" } as Record<string, string>)[hideWhen] ?? hideWhen
            : hideWhen;
          return !p[flag];
        }).map(({ href, icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                width: 48, height: 48, borderRadius: 9999, border: "none", textDecoration: "none",
                transition: "all 0.3s",
                ...(active
                  ? { background: c.navActiveBg, color: c.navActiveText, boxShadow: isDark ? "0 0 15px 0 rgba(71,133,255,0.4)" : "0 10px 15px -3px rgba(0,0,0,.1)" }
                  : { background: "transparent", color: c.navInactiveText }),
              }}
            >
              <span
                className={active ? "mso mso-fill" : "mso"}
                style={{ fontSize: 22 }}
              >
                {icon}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
