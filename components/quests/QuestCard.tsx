"use client";

// ─────────────────────────────────────────────────────────────────────────────
// QuestCard — one habit, two modes:
//   • "recommend" → shows yearly CO₂ saved + impact/effort flair, "Accept" CTA
//   • "active"    → the quest goal + an emerald "Complete" CTA
// The category icon sits on its tinted disc, effort renders as 1–5 dots, and an
// "impact / effort" leverage chip hints why this quest is worth it. The card
// is a layout-animated motion element so the parent list can fly items in/out.
// onAction receives the click coords so the page can launch confetti from the tap.
// ─────────────────────────────────────────────────────────────────────────────

import { motion, useReducedMotion } from "framer-motion";

import type { RankedAction } from "@/types";
import { CATEGORY_META } from "@/lib/constants";
import { cn, formatCo2 } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export type QuestCardMode = "recommend" | "active";

export interface QuestCardProps {
  action: RankedAction;
  mode: QuestCardMode;
  onAction: (origin?: { x: number; y: number }) => void;
  onAbandon?: () => void;
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

export function QuestCard({
  action,
  mode,
  onAction,
  onAbandon,
  className,
}: QuestCardProps) {
  const reduce = useReducedMotion();
  const { template, annualSavingKg } = action;
  const meta = CATEGORY_META[template.category];

  // leverage = impact relative to effort, surfaced as a tiny meter (0..1)
  const leverage = Math.min(1, annualSavingKg / template.effort / 600);

  return (
    <motion.div
      layout={!reduce}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, x: 40, scale: 0.92 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      whileHover={reduce ? undefined : { y: -3 }}
      className={cn(
        "glass relative flex flex-col gap-4 overflow-hidden rounded-2xl p-4 sm:p-5",
        "border border-white/8 transition-colors hover:border-canopy/30",
        className,
      )}
    >
      <div className="flex items-start gap-3">
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
            {mode === "active" ? template.quest.goal : template.description}
          </p>
        </div>
      </div>

      {/* stat row: saved/yr + effort */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-canopy-soft">
          <Icon name="Leaf" size={13} />
          {formatCo2(annualSavingKg)}
          <span className="font-sans font-normal text-faint">/yr saved</span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-faint">
          effort <EffortDots effort={template.effort} />
        </span>
        {mode === "active" && (
          <span className="inline-flex items-center gap-1.5 text-faint">
            <Icon name="Repeat" size={12} />
            {template.quest.target} {template.quest.unit}
          </span>
        )}
      </div>

      {/* leverage meter — "impact per effort" flair */}
      {mode === "recommend" && (
        <div>
          <div className="mb-1 flex items-center justify-between text-[0.65rem] font-medium uppercase tracking-wider text-faint">
            <span>Leverage</span>
            <span className="text-canopy-soft">
              {leverage > 0.66 ? "High" : leverage > 0.33 ? "Solid" : "Steady"}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-canopy to-leaf"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(8, leverage * 100)}%` }}
              transition={reduce ? { duration: 0 } : { duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      )}

      {/* actions */}
      <div className="mt-auto flex items-center gap-2">
        {mode === "recommend" ? (
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={(e) => onAction({ x: e.clientX, y: e.clientY })}
          >
            <Icon name="Plus" size={16} />
            Accept quest
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              className="flex-1"
              onClick={(e) => onAction({ x: e.clientX, y: e.clientY })}
            >
              <Icon name="Check" size={16} />
              Complete
            </Button>
            {onAbandon && (
              <Button
                size="sm"
                variant="ghost"
                aria-label="Abandon quest"
                onClick={onAbandon}
              >
                <Icon name="X" size={16} />
              </Button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

export default QuestCard;
