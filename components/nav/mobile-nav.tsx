"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "home", label: "Home" },
  { href: "/lessons", icon: "menu_book", label: "Lessons" },
  { href: "/vocabulary", icon: "format_list_bulleted", label: "Vocab" },
  { href: "/profile", icon: "person", label: "Profile" },
];

export function MobileNav() {
  const pathname = usePathname();

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
        background: "rgba(249,249,247,0.7)", backdropFilter: "blur(48px)", WebkitBackdropFilter: "blur(48px)",
        borderRadius: 9999, margin: "0 24px", height: 64, width: "100%",
        display: "flex", justifyContent: "space-around", alignItems: "center",
        boxShadow: "0px 12px 32px rgba(26,28,27,0.06)", pointerEvents: "auto",
      }}>
        {NAV_ITEMS.map(({ href, icon, label }) => {
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
                  ? { background: "#002975", color: "#ffffff", boxShadow: "0 10px 15px -3px rgba(0,0,0,.1)" }
                  : { background: "transparent", color: "rgba(26,28,27,0.5)" }),
              }}
            >
              <span
                className={active ? "mso mso-fill" : "mso"}
                style={{ fontSize: 20 }}
              >
                {icon}
              </span>
              {!active && (
                <span style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em",
                  fontWeight: 700, marginTop: 2,
                }}>
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
