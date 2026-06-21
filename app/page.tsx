"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Landing / hero. Chrome-free (AppShell hides itself on "/"). After hydration the
// primary CTA adapts: onboarded → "Open dashboard", else → "Build my twin".
// The hero visual is a teaser of the Living Tree orbited by category stat rings.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

import { useAppStore, useHydrated } from "@/lib/store/useAppStore";
import { CATEGORY_META } from "@/lib/constants";
import { CATEGORIES } from "@/types";
import { INDIA_AVERAGE_KG } from "@/lib/emissions/factors";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Chip } from "@/components/ui/Chip";
import { LivingTree } from "@/components/dashboard/LivingTree";

const FEATURES = [
  {
    icon: "ScanLine",
    title: "Build your twin",
    body: "A living model of your home, travel, diet and habits — in two minutes.",
  },
  {
    icon: "SlidersHorizontal",
    title: "Simulate the future",
    body: "Drag a slider, watch tonnes of CO₂ vanish. See payback in rupees too.",
  },
  {
    icon: "Trophy",
    title: "Make it a game",
    body: "Turn the best changes into quests. Build streaks. Grow your forest.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export default function Landing() {
  const router = useRouter();
  const hydrated = useHydrated();
  const onboarded = useAppStore((s) => s.onboarded);
  const reduce = useReducedMotion();

  const ctaHref = onboarded ? "/dashboard" : "/onboarding";
  const ctaLabel = onboarded ? "Open dashboard" : "Build my twin";

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-6xl px-5 sm:px-8">
      {/* top bar */}
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-canopy to-tide shadow-[0_4px_16px_-4px_rgba(52,211,153,0.6)]">
            <Icon name="Leaf" size={18} className="text-[#04130c]" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Eco<span className="text-gradient">Twin</span>
          </span>
        </div>
        {hydrated && (
          <Link
            href={ctaHref}
            className="text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            {onboarded ? "Dashboard →" : "Get started →"}
          </Link>
        )}
      </header>

      {/* hero */}
      <section className="grid items-center gap-10 pb-16 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:pb-24 lg:pt-16">
        <motion.div
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.09, delayChildren: 0.05 }}
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <Chip icon="Sparkles" tone="canopy" className="mb-6">
              Your carbon footprint, alive
            </Chip>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-balance text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl"
          >
            Meet your <span className="text-gradient">carbon twin.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 max-w-md text-lg leading-relaxed text-muted sm:text-xl"
          >
            Understand it. Shrink it. Make it a game. A breathing model of your
            lifestyle that gets healthier as your footprint falls.
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            {hydrated ? (
              <Button size="lg" onClick={() => router.push(ctaHref)}>
                {ctaLabel}
                <Icon name="ArrowRight" size={18} />
              </Button>
            ) : (
              <div className="skeleton h-14 w-48 rounded-2xl" />
            )}
            <Button variant="outline" size="lg" onClick={() => router.push("/onboarding")}>
              See how it works
            </Button>
          </motion.div>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 flex items-center gap-4 text-sm text-faint"
          >
            <span className="flex items-center gap-1.5">
              <Icon name="ShieldCheck" size={15} className="text-canopy" />
              No account, stays on your device
            </span>
            <span className="hidden items-center gap-1.5 sm:flex">
              <Icon name="Zap" size={15} className="text-leaf" />
              ~2 min setup
            </span>
          </motion.div>
        </motion.div>

        {/* hero visual: living tree orbited by category rings */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center"
        >
          {/* glow */}
          <div className="absolute inset-8 rounded-full bg-canopy/15 blur-3xl" />

          {/* orbiting category dots */}
          <motion.div
            className="absolute inset-0"
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 48, ease: "linear", repeat: Infinity }}
          >
            {CATEGORIES.map((cat, i) => {
              const angle = (i / CATEGORIES.length) * Math.PI * 2;
              const radius = 46; // % from center
              const x = 50 + Math.cos(angle) * radius;
              const y = 50 + Math.sin(angle) * radius;
              return (
                <div
                  key={cat}
                  className="absolute grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl glass"
                  style={{ left: `${x}%`, top: `${y}%`, color: CATEGORY_META[cat].color }}
                >
                  <motion.div animate={reduce ? undefined : { rotate: -360 }} transition={{ duration: 48, ease: "linear", repeat: Infinity }}>
                    <Icon name={CATEGORY_META[cat].icon} size={18} />
                  </motion.div>
                </div>
              );
            })}
          </motion.div>

          {/* the tree */}
          <div className="relative z-10 w-[62%]">
            <LivingTree progress={0.72} />
          </div>
        </motion.div>
      </section>

      {/* features */}
      <section className="grid gap-4 pb-24 sm:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
            className="glass rounded-2xl p-6"
          >
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-canopy/20 to-tide/10 text-canopy-soft">
              <Icon name={f.icon} size={20} />
            </div>
            <h3 className="text-lg font-semibold text-ink">{f.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.body}</p>
          </motion.div>
        ))}
      </section>

      {/* footer note */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-faint">
        EcoTwin · India-tuned carbon model · the India average is{" "}
        {(INDIA_AVERAGE_KG / 1000).toFixed(1)} t / year
      </footer>
    </div>
  );
}
