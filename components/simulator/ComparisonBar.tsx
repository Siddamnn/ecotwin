"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ComparisonBar — the before→after readout for the simulator. Two stacked bars
// (saved baseline = grey, simulated = emerald) scaled to a shared max so the
// shrink is visceral; the emerald bar animates its width on every lever change.
// A delta pill (green when lower, amber when higher) sits beside the simulated
// bar. Reduced-motion safe (width snaps instead of springing).
// ─────────────────────────────────────────────────────────────────────────────

import { motion, useReducedMotion } from "framer-motion";

import { cn, formatCo2 } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

export interface ComparisonBarProps {
  /** The saved twin's total (the "before"). */
  baseTotal: number;
  /** The draft total (the "after"). */
  draftTotal: number;
  className?: string;
}

export function ComparisonBar({ baseTotal, draftTotal, className }: ComparisonBarProps) {
  const reduce = useReducedMotion();
  const max = Math.max(baseTotal, draftTotal, 1);
  const delta = draftTotal - baseTotal; // negative = improvement
  const lower = delta < -0.5;
  const higher = delta > 0.5;

  const basePct = (baseTotal / max) * 100;
  const draftPct = (draftTotal / max) * 100;

  return (
    <div className={cn("space-y-3", className)}>
      {/* before */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-faint">Your saved twin</span>
          <span className="font-mono font-semibold text-muted">
            {formatCo2(baseTotal)}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/6">
          <motion.div
            className="h-full rounded-full bg-white/18"
            initial={false}
            animate={{ width: `${basePct}%` }}
            transition={reduce ? { duration: 0 } : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      {/* after */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-canopy-soft">Simulated</span>
          <span className="font-mono font-semibold text-canopy">
            {formatCo2(draftTotal)}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/6">
          <motion.div
            className={cn(
              "h-full rounded-full",
              higher
                ? "bg-gradient-to-r from-warn to-danger"
                : "bg-gradient-to-r from-canopy to-leaf",
            )}
            initial={false}
            animate={{ width: `${Math.max(2, draftPct)}%` }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 22 }}
          />
        </div>
      </div>

      {/* delta pill */}
      <div className="flex justify-end">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
            lower && "bg-canopy/12 text-canopy-soft",
            higher && "bg-warn/12 text-warn",
            !lower && !higher && "bg-white/6 text-faint",
          )}
        >
          <Icon
            name={lower ? "TrendingDown" : higher ? "TrendingUp" : "Minus"}
            size={14}
          />
          {lower || higher ? `${delta > 0 ? "+" : "−"}${formatCo2(Math.abs(delta))}/yr` : "No change yet"}
        </span>
      </div>
    </div>
  );
}

export default ComparisonBar;
