"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Insights — the coach. A purely-templated narrative (no API): greet, verdict vs
// the India average, the dominant category, the single highest-leverage action,
// and a projection if the top-3 ranked actions were all adopted. Below it, the
// full ranked list as InsightCards, each able to become a quest.
// Gated on hydration with skeletons; redirects to /onboarding when not onboarded.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import type { Category } from "@/types";
import { calculate } from "@/lib/emissions/calculate";
import { vsIndiaAverage } from "@/lib/emissions/equivalents";
import { INDIA_AVERAGE_KG } from "@/lib/emissions/factors";
import { rankActions, topAction } from "@/lib/actions/rank";
import { CATEGORY_META } from "@/lib/constants";
import { useAppStore, useHydrated } from "@/lib/store/useAppStore";
import { cn, formatCo2 } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { InsightCard } from "@/components/insights/InsightCard";

function dominantCategory(perCategory: Record<Category, number>): Category {
  return (Object.entries(perCategory) as [Category, number][]).sort(
    (a, b) => b[1] - a[1],
  )[0][0];
}

function InsightsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="skeleton h-64 rounded-3xl" />
      <div className="skeleton h-8 w-56 rounded-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-56 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const onboarded = useAppStore((s) => s.onboarded);
  const twin = useAppStore((s) => s.twin);
  const acceptQuest = useAppStore((s) => s.acceptQuest);

  useEffect(() => {
    if (hydrated && !onboarded) router.replace("/onboarding");
  }, [hydrated, onboarded, router]);

  const breakdown = useMemo(() => calculate(twin), [twin]);
  const ranked = useMemo(() => rankActions(twin), [twin]);
  const top = useMemo(() => topAction(twin), [twin]);

  // projection: apply the top-3 actions in sequence and re-measure
  const projection = useMemo(() => {
    const top3 = ranked.slice(0, 3);
    let projected = twin;
    for (const r of top3) projected = r.template.apply(projected);
    const projectedTotal = calculate(projected).total;
    return {
      count: top3.length,
      total: projectedTotal,
      saved: Math.max(0, breakdown.total - projectedTotal),
    };
  }, [ranked, twin, breakdown.total]);

  const maxScore = ranked.length ? ranked[0].score : 0;

  function makeQuest(id: string) {
    acceptQuest(id);
    router.push("/quests");
  }

  if (!hydrated || !onboarded) {
    return (
      <div className="py-2">
        <InsightsSkeleton />
      </div>
    );
  }

  // ── assemble the coach narrative (pure strings) ───────────────────────────
  const total = breakdown.total;
  const ratio = vsIndiaAverage(total);
  const domCat = dominantCategory(breakdown.perCategory);
  const domMeta = CATEGORY_META[domCat];
  const domKg = breakdown.perCategory[domCat];
  const domPct = Math.round((domKg / Math.max(1, total)) * 100);

  const verdict =
    ratio >= 1.4
      ? {
          tone: "warn" as const,
          line: `That's about ${ratio.toFixed(1)}× the average Indian footprint of ${formatCo2(
            INDIA_AVERAGE_KG,
          )} — there's real room to move, and that's good news: it means high-leverage wins are on the table.`,
        }
      : ratio >= 0.95
        ? {
            tone: "default" as const,
            line: `That's right around the average Indian footprint of ${formatCo2(
              INDIA_AVERAGE_KG,
            )}. A few smart swaps will pull you comfortably below it.`,
          }
        : {
            tone: "good" as const,
            line: `That's already below the average Indian footprint of ${formatCo2(
              INDIA_AVERAGE_KG,
            )} — genuinely impressive. Now it's about shaving the last stubborn kilos.`,
          };

  const greeting = "Here's your coaching read for this week.";

  return (
    <div className="space-y-6 pb-2">
      <header>
        <h1 className="text-2xl font-bold text-ink">Insights</h1>
        <p className="mt-1 text-sm text-muted">
          Your highest-leverage moves, ranked for your life.
        </p>
      </header>

      {/* ── the coach narrative ────────────────────────────────────────────── */}
      <GlassCard strong glow className="relative overflow-hidden">
        <div className="bg-grain absolute inset-0 -z-10 opacity-[0.06]" />
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-canopy to-tide text-[#04130c]">
            <Icon name="Sparkles" size={18} />
          </span>
          <p className="text-sm font-semibold text-ink">Your eco coach</p>
        </div>

        <div className="mt-5 space-y-4 text-[0.95rem] leading-relaxed text-muted">
          <p>
            {greeting} Your annual footprint sits at{" "}
            <span className="font-mono font-semibold text-ink">{formatCo2(total)}</span>{" "}
            of CO₂e.{" "}
            <span
              className={cn(
                verdict.tone === "warn" && "text-warn",
                verdict.tone === "good" && "text-canopy-soft",
              )}
            >
              {verdict.line}
            </span>
          </p>

          <p>
            Your biggest single source is{" "}
            <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
              <Icon name={domMeta.icon} size={15} style={{ color: domMeta.color }} />
              {domMeta.label}
            </span>{" "}
            at <span className="font-mono font-semibold text-ink">{formatCo2(domKg)}</span>{" "}
            — roughly {domPct}% of your total. That&apos;s where the leverage lives.
          </p>

          {top && (
            <p>
              If I could pick one move for you, it&apos;s{" "}
              <span className="font-semibold text-canopy-soft">{top.template.title}</span>.
              It saves about{" "}
              <span className="font-mono font-semibold text-ink">
                {formatCo2(top.annualSavingKg)}
              </span>{" "}
              a year for effort level {top.template.effort} of 5 — the best bang-for-effort
              on your list.
            </p>
          )}

          {projection.count > 0 && projection.saved > 0.5 && (
            <p>
              Stack your top {projection.count} moves together and your footprint would fall
              to{" "}
              <span className="font-mono font-semibold text-canopy">
                {formatCo2(projection.total)}
              </span>{" "}
              — that&apos;s{" "}
              <span className="font-semibold text-leaf">
                {formatCo2(projection.saved)} lighter every year
              </span>
              . Turn them into quests and let&apos;s make it stick.
            </p>
          )}
        </div>

        {/* projection summary chips */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <ProjectionStat label="Now" value={formatCo2(total)} tone="muted" />
          <ProjectionStat
            label={`Top ${projection.count} applied`}
            value={formatCo2(projection.total)}
            tone="good"
          />
          <ProjectionStat label="Saved/yr" value={formatCo2(projection.saved)} tone="leaf" />
        </div>
      </GlassCard>

      {/* ── ranked recommendations ─────────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Icon name="ListOrdered" size={18} className="text-canopy" />
          <h2 className="text-base font-semibold text-ink">Ranked for you</h2>
          <span className="ml-auto text-xs text-faint">
            By impact per effort
          </span>
        </div>

        {ranked.length === 0 ? (
          <GlassCard>
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Icon name="PartyPopper" size={28} className="text-canopy" />
              <p className="max-w-sm text-sm text-muted">
                We couldn&apos;t find any high-impact changes left for your twin — you&apos;ve
                already optimised the big ones. Beautifully done.
              </p>
            </div>
          </GlassCard>
        ) : (
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          >
            {ranked.map((action, i) => (
              <InsightCard
                key={action.template.id}
                rank={i + 1}
                action={action}
                maxScore={maxScore}
                onMakeQuest={() => makeQuest(action.template.id)}
              />
            ))}
          </motion.div>
        )}
      </section>

      <div className="flex justify-center pt-1">
        <Button variant="secondary" onClick={() => router.push("/simulator")}>
          <Icon name="SlidersHorizontal" size={16} />
          Test these in the simulator
        </Button>
      </div>
    </div>
  );
}

function ProjectionStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "muted" | "good" | "leaf";
}) {
  return (
    <div className="rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2.5 text-center">
      <p className="truncate text-[0.65rem] font-medium uppercase tracking-wider text-faint">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-mono text-sm font-bold tabular-nums",
          tone === "muted" && "text-muted",
          tone === "good" && "text-canopy",
          tone === "leaf" && "text-leaf",
        )}
      >
        {value}
      </p>
    </div>
  );
}
