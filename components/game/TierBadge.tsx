"use client";

// ─────────────────────────────────────────────────────────────────────────────
// TierBadge — the player's rank at a glance. The tier emoji floats on its own
// gradient disc, ringed by a ProgressRing showing how far through the current
// tier the points are. A compact line names the tier and the next threshold.
// Reduced-motion safe (the ProgressRing and Button already are).
// ─────────────────────────────────────────────────────────────────────────────

import { motion, useReducedMotion } from "framer-motion";

import { getNextTier, tierProgress } from "@/lib/game";
import { cn } from "@/lib/utils";
import { ProgressRing } from "@/components/ui/ProgressRing";

export interface TierBadgeProps {
  points: number;
  className?: string;
}

export function TierBadge({ points, className }: TierBadgeProps) {
  const reduce = useReducedMotion();
  const { current, next, pct } = tierProgress(points);
  const nextTier = getNextTier(points);
  const ptsToNext = nextTier ? nextTier.minPoints - points : 0;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <ProgressRing progress={pct} size={84} stroke={7}>
        <motion.span
          aria-hidden
          className={cn(
            "grid h-[54px] w-[54px] place-items-center rounded-full text-2xl",
            "bg-gradient-to-br shadow-[0_6px_20px_-6px_rgba(52,211,153,0.6)]",
            current.gradient,
          )}
          initial={reduce ? false : { scale: 0.6, rotate: -12, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
        >
          {current.emoji}
        </motion.span>
      </ProgressRing>

      <div className="min-w-0">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-faint">
          Rank
        </p>
        <p className="text-lg font-semibold leading-tight text-ink">
          {current.name}
        </p>
        {next ? (
          <p className="mt-0.5 text-xs text-muted">
            <span className="font-mono font-semibold text-canopy-soft">
              {ptsToNext.toLocaleString("en-IN")}
            </span>{" "}
            pts to {next.emoji} {next.name}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-leaf">Max tier — Forest Guardian.</p>
        )}
      </div>
    </div>
  );
}

export default TierBadge;
