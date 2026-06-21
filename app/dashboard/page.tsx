"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard — the home screen. Gated on hydration; redirects to /onboarding when
// not onboarded. Footprint hero, the signature Living Tree, breakdown donut,
// trend line and an editable target card. Cards stagger-reveal on mount.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

import { calculate } from "@/lib/emissions/calculate";
import { useAppStore, useHydrated } from "@/lib/store/useAppStore";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import { FootprintHero } from "@/components/dashboard/FootprintHero";
import { LivingTree } from "@/components/dashboard/LivingTree";
import { TargetCard } from "@/components/dashboard/TargetCard";

// recharts is heavy (~100 KB gz). Keep it out of the dashboard's initial bundle:
// both charts are client-only (the page is gated on hydration anyway) and load in
// their own chunks behind size-matched skeletons, so there's no layout shift.
const BreakdownDonut = dynamic(
  () => import("@/components/dashboard/BreakdownDonut").then((m) => m.BreakdownDonut),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="mx-auto h-44 w-44 shrink-0">
          <div className="skeleton h-full w-full rounded-full" />
        </div>
        <ul className="flex-1 space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <li key={i} className="skeleton h-8 rounded-lg" />
          ))}
        </ul>
      </div>
    ),
  },
);

const TrendLine = dynamic(
  () => import("@/components/dashboard/TrendLine").then((m) => m.TrendLine),
  {
    ssr: false,
    loading: () => <div className="skeleton h-48 w-full rounded-2xl" />,
  },
);

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
};

function SectionTitle({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted">
      <Icon name={icon} size={16} className="text-canopy" />
      {children}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="skeleton h-40 rounded-3xl" />
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <div className="skeleton h-80 rounded-3xl" />
        <div className="skeleton h-80 rounded-3xl" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="skeleton h-56 rounded-3xl" />
        <div className="skeleton h-56 rounded-3xl" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const onboarded = useAppStore((s) => s.onboarded);
  const twin = useAppStore((s) => s.twin);
  const baselineKg = useAppStore((s) => s.baselineKg);
  const targetKg = useAppStore((s) => s.targetKg);
  const history = useAppStore((s) => s.game.footprintHistory);
  const setTarget = useAppStore((s) => s.setTarget);

  useEffect(() => {
    if (hydrated && !onboarded) router.replace("/onboarding");
  }, [hydrated, onboarded, router]);

  const breakdown = useMemo(() => calculate(twin), [twin]);
  const current = breakdown.total;
  const baseline = baselineKg || current;

  // tree fullness: how far current has fallen from baseline toward target
  const treeProgress = useMemo(() => {
    const span = Math.max(1, baseline - targetKg);
    return Math.max(0.06, Math.min(1, (baseline - current) / span));
  }, [baseline, current, targetKg]);

  if (!hydrated || !onboarded) {
    return (
      <div className="py-2">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      {/* hero */}
      <motion.div variants={item}>
        <GlassCard strong glow className="overflow-hidden">
          <FootprintHero total={current} />
        </GlassCard>
      </motion.div>

      {/* tree + breakdown */}
      <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr]">
        <motion.div variants={item}>
          <GlassCard className="relative flex h-full flex-col items-center overflow-hidden">
            <SectionTitle icon="TreePine">Your living twin</SectionTitle>
            <div className="flex flex-1 items-center justify-center py-2">
              <div className="w-full max-w-[280px]">
                <LivingTree progress={treeProgress} />
              </div>
            </div>
            <p className="mt-2 text-center text-sm text-muted">
              {treeProgress >= 0.99
                ? "Flourishing — you've reached your target."
                : treeProgress > 0.4
                  ? "Growing greener. Keep going."
                  : "Every change makes it grow. Start a quest."}
            </p>
          </GlassCard>
        </motion.div>

        <motion.div variants={item}>
          <GlassCard className="h-full">
            <SectionTitle icon="ChartPie">Where it comes from</SectionTitle>
            <BreakdownDonut breakdown={breakdown} />
          </GlassCard>
        </motion.div>
      </div>

      {/* trend + target */}
      <div className="grid gap-5 lg:grid-cols-2">
        <motion.div variants={item}>
          <GlassCard className="h-full">
            <SectionTitle icon="TrendingDown">Footprint over time</SectionTitle>
            <TrendLine history={history} targetKg={targetKg} />
          </GlassCard>
        </motion.div>

        <motion.div variants={item}>
          <GlassCard className="h-full">
            <SectionTitle icon="Target">Your target</SectionTitle>
            <TargetCard
              current={current}
              baseline={baseline}
              target={targetKg}
              onSetTarget={setTarget}
            />
          </GlassCard>
        </motion.div>
      </div>

      {/* gentle pointer toward pass-2 surfaces */}
      <motion.div variants={item}>
        <div className={cn("flex flex-wrap items-center justify-center gap-2 pt-1 text-sm text-faint")}>
          <Icon name="Compass" size={15} className="text-canopy" />
          Head to the Simulator to test changes, or Quests to make them stick.
        </div>
      </motion.div>
    </motion.div>
  );
}
