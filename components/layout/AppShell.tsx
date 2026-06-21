"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AppShell — the chrome around the app screens. A left rail on desktop, a bottom
// tab bar on mobile, with an animated active pill (shared layoutId). Auto-hides
// itself on the landing ("/") and onboarding routes so those stay full-bleed.
// Wrap an app screen with <AppShell>…</AppShell>; content is run through
// PageTransition for smooth route changes.
// ─────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { PageTransition } from "./PageTransition";

interface Tab {
  href: string;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/simulator", label: "Simulator", icon: "SlidersHorizontal" },
  { href: "/quests", label: "Quests", icon: "Target" },
  { href: "/insights", label: "Insights", icon: "Sparkles" },
];

/** Routes that render without the shell chrome. */
const CHROMELESS = ["/", "/onboarding"];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  if (CHROMELESS.includes(pathname)) {
    return <>{children}</>;
  }

  // Two nav surfaces (rail + bottom bar) coexist in the DOM, so each gets its own
  // layoutId — otherwise framer-motion would try to share one pill across both.
  const indicator = (layoutId: string) => (
    <motion.span
      layoutId={layoutId}
      className={cn(
        "absolute inset-0 -z-10 rounded-2xl",
        "bg-gradient-to-br from-canopy/20 to-tide/15 border border-canopy/30",
      )}
      transition={
        reduce
          ? { duration: 0 }
          : { type: "spring", stiffness: 480, damping: 38 }
      }
    />
  );

  return (
    <div className="relative flex min-h-dvh w-full">
      {/* ── desktop left rail ─────────────────────────────────────────────── */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-2 border-r border-white/5 px-4 py-6 md:flex">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2.5 px-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-canopy to-tide shadow-[0_4px_16px_-4px_rgba(52,211,153,0.6)]">
            <Icon name="Leaf" size={18} className="text-[#04130c]" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-ink">
            Eco<span className="text-gradient">Twin</span>
          </span>
        </Link>

        <nav className="flex flex-col gap-1">
          {TABS.map((tab) => {
            const active = isActive(pathname, tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-colors",
                  active ? "text-canopy-soft" : "text-muted hover:text-ink",
                )}
              >
                {active && indicator("eco-nav-rail")}
                <Icon
                  name={tab.icon}
                  size={20}
                  className={cn(
                    "shrink-0 transition-transform",
                    !active && "group-hover:scale-110",
                  )}
                />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── content ───────────────────────────────────────────────────────── */}
      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-6 md:px-10 md:pb-12 md:pt-10">
        <div className="mx-auto w-full max-w-6xl">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>

      {/* ── mobile bottom tab bar ─────────────────────────────────────────── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 md:hidden">
        <div className="glass-strong mx-auto flex max-w-md items-center justify-around rounded-3xl px-2 py-1.5">
          {TABS.map((tab) => {
            const active = isActive(pathname, tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[0.65rem] font-medium transition-colors",
                  active ? "text-canopy-soft" : "text-faint hover:text-muted",
                )}
              >
                {active && indicator("eco-nav-bar")}
                <Icon name={tab.icon} size={20} className="shrink-0" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default AppShell;
