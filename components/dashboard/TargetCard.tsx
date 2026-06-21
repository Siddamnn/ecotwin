"use client";

// ─────────────────────────────────────────────────────────────────────────────
// TargetCard — current footprint vs the user's target, shown as a ProgressRing
// (progress = how far current has fallen from baseline toward target). The target
// is editable inline via a Slider that commits through setTarget.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { SUSTAINABLE_TARGET_KG } from "@/lib/emissions/factors";
import { cn, formatCo2 } from "@/lib/utils";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export interface TargetCardProps {
  current: number;
  baseline: number;
  target: number;
  onSetTarget: (kg: number) => void;
  className?: string;
}

export function TargetCard({
  current,
  baseline,
  target,
  onSetTarget,
  className,
}: TargetCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(target);

  // progress toward target from the baseline (0 at baseline, 1 at/under target)
  const span = Math.max(1, baseline - target);
  const progress = Math.max(0, Math.min(1, (baseline - current) / span));
  const reached = current <= target;
  const remaining = Math.max(0, current - target);

  return (
    <div className={cn("flex flex-col gap-5 sm:flex-row sm:items-center", className)}>
      <ProgressRing progress={progress} size={140} stroke={12} className="mx-auto shrink-0">
        <div className="text-center">
          <p className="font-mono text-2xl font-semibold tabular-nums text-ink">
            {Math.round(progress * 100)}%
          </p>
          <p className="text-[0.65rem] uppercase tracking-wider text-faint">to target</p>
        </div>
      </ProgressRing>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Annual target</p>
            <p className="font-mono text-2xl font-semibold tabular-nums text-canopy-soft">
              {formatCo2(target)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDraft(target);
              setEditing((e) => !e);
            }}
          >
            <Icon name={editing ? "X" : "Pencil"} size={15} />
            {editing ? "Close" : "Edit"}
          </Button>
        </div>

        <p className="mt-2 text-sm text-muted">
          {reached ? (
            <span className="text-canopy-soft">You&apos;ve hit your target. Time to aim lower.</span>
          ) : (
            <>
              <span className="font-medium text-ink">{formatCo2(remaining)}</span> over
              target — keep shrinking it.
            </>
          )}
        </p>

        <AnimatePresence initial={false}>
          {editing && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-4">
                <Slider
                  value={draft}
                  min={SUSTAINABLE_TARGET_KG / 2}
                  max={Math.max(baseline, SUSTAINABLE_TARGET_KG)}
                  step={50}
                  onChange={setDraft}
                  format={(v) => formatCo2(v)}
                />
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => {
                      onSetTarget(draft);
                      setEditing(false);
                    }}
                  >
                    Save target
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default TargetCard;
