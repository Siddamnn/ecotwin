"use client";

// ─────────────────────────────────────────────────────────────────────────────
// InsightCard — one ranked recommendation. Rank badge, category icon, title,
// yearly CO₂ saved, effort dots, optional payback / money-saved, and a subtle
// "leverage" meter for the impact-per-effort score. A single CTA turns it into a
// quest. Stagger-revealed by the parent; hover lifts the card.
// ─────────────────────────────────────────────────────────────────────────────

import { motion, useReducedMotion } from "framer-motion";

import type { RankedAction } from "@/types";
import { CATEGORY_META } from "@/lib/constants";
import { cn, formatCo2, formatInr } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export interface InsightCardProps {
  rank: number;
  action: RankedAction;
  /** Shared denominator so leverage meters are comparable across the list. */
  maxScore: number;
  onMakeQuest: () => void;
  className?: string;
}

function EffortDots({ effort }: { effort: number }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Effort ${effort} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            i <= effort ? "bg-canopy-soft" : "bg-white/12",
          )}
        />
      ))}
    </span>
  );
}

export function InsightCard({
  rank,
  action,
  maxScore,
  onMakeQuest,
  className,
}: InsightCardProps) {
  const reduce = useReducedMotion();
  const { template, annualSavingKg, annualSavingInr, paybackMonths } = action;
  const meta = CATEGORY_META[template.category];
  const leverage = maxScore > 0 ? Math.min(1, action.score / maxScore) : 0;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: {
          opacity: 1,
          y: 0,
          transition: reduce ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 26 },
        },
      }}
      whileHover={reduce ? undefined : { y: -3 }}
      className={cn(
        "glass relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/8 p-5 transition-colors hover:border-canopy/30",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {/* rank badge */}
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/6 font-mono text-sm font-bold text-canopy-soft">
          {rank}
        </span>
        {/* category disc */}
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
          style={{
            backgroundColor: `${meta.color}1f`,
            color: meta.color,
            boxShadow: `inset 0 0 0 1px ${meta.color}40`,
          }}
        >
          <Icon name={template.icon} size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="text-[0.95rem] font-semibold leading-snug text-ink">
            {template.title}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted line-clamp-2">
            {template.description}
          </p>
        </div>
      </div>

      {/* stats */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-canopy-soft">
          <Icon name="Leaf" size={13} />
          {formatCo2(annualSavingKg)}
          <span className="font-sans font-normal text-faint">/yr</span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-faint">
          effort <EffortDots effort={template.effort} />
        </span>
        {annualSavingInr > 0 && (
          <span className="inline-flex items-center gap-1.5 text-faint">
            <Icon name="Wallet" size={12} />
            {formatInr(annualSavingInr)}/yr
          </span>
        )}
        {paybackMonths !== undefined && paybackMonths > 0 && (
          <span className="inline-flex items-center gap-1.5 text-faint">
            <Icon name="Hourglass" size={12} />
            ~{Math.round(paybackMonths)} mo payback
          </span>
        )}
      </div>

      {/* leverage meter */}
      <div>
        <div className="mb-1 flex items-center justify-between text-[0.65rem] font-medium uppercase tracking-wider text-faint">
          <span>Leverage</span>
          <span className="text-canopy-soft">{Math.round(leverage * 100)}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-canopy via-leaf to-tide"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(6, leverage * 100)}%` }}
            transition={reduce ? { duration: 0 } : { duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      <Button size="sm" variant="outline" className="mt-auto w-full" onClick={onMakeQuest}>
        <Icon name="Target" size={16} />
        Make it a quest
      </Button>
    </motion.div>
  );
}

export default InsightCard;
