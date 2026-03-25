"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, BookMarked, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/lessons", icon: BookOpen, label: "Lessons" },
  { href: "/vocabulary", icon: BookMarked, label: "Vocab" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-6 left-4 right-4 z-50 md:hidden rounded-full bg-white/80 dark:bg-[var(--card-bg)]/85 backdrop-blur-xl shadow-float"
      style={{ border: "0.5px solid var(--border)" }}
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center justify-center rounded-full transition-all duration-300 min-w-[44px] min-h-[44px]",
                active
                  ? "gap-2 px-4 bg-[#003DA5] text-white"
                  : "w-11 h-11 text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10"
              )}
              aria-label={label}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
              {active && (
                <span className="text-[10px] font-bold uppercase tracking-[0.05em] whitespace-nowrap">
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
