"use client";

// ─────────────────────────────────────────────────────────────────────────────
// StreakFlame — the daily-check-in flame. It flickers and grows with the streak
// length: a calm grey ember at 0, a roaring multi-layer flame at 30+. The flame
// glow and scale are derived from `days` (capped) so it never runs away. The day
// count sits beside it. Reduced-motion safe (flicker freezes, no layout shift).
// ─────────────────────────────────────────────────────────────────────────────

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

export interface StreakFlameProps {
  days: number;
  className?: string;
}

export function StreakFlame({ days, className }: StreakFlameProps) {
  const reduce = useReducedMotion();
  const alive = days > 0;
  // intensity 0..1, saturates around a 21-day streak
  const intensity = Math.min(1, days / 21);
  const size = 30 + intensity * 18; // 30 → 48 px
  const glow = 8 + intensity * 26;

  const flameColor = alive
    ? `hsl(${28 - intensity * 18}, 95%, ${58 + intensity * 6}%)`
    : "var(--color-faint)";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className="relative grid place-items-center"
        style={{ width: size + 8, height: size + 8 }}
      >
        {/* radiant halo behind the flame */}
        {alive && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full blur-md"
            style={{
              background: `radial-gradient(circle, rgba(251,146,60,${0.25 + intensity * 0.4}), transparent 70%)`,
            }}
          />
        )}
        <motion.span
          aria-hidden
          style={{ color: flameColor, transformOrigin: "bottom center" }}
          animate={
            reduce || !alive
              ? undefined
              : {
                  scale: [1, 1.12, 0.96, 1.08, 1],
                  rotate: [-2, 2, -1, 1, -2],
                }
          }
          transition={
            reduce || !alive
              ? undefined
              : {
                  duration: 1.6 - intensity * 0.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
        >
          <Icon
            name="Flame"
            size={size}
            style={{
              filter: alive
                ? `drop-shadow(0 0 ${glow}px rgba(251,146,60,${0.5 + intensity * 0.4}))`
                : undefined,
            }}
            fill={alive ? "currentColor" : "none"}
          />
        </motion.span>
      </div>

      <div className="leading-tight">
        <p
          className={cn(
            "font-mono text-xl font-bold tabular-nums",
            alive ? "text-ink" : "text-faint",
          )}
        >
          {days}
        </p>
        <p className="text-[0.7rem] font-medium text-faint">
          day{days === 1 ? "" : "s"} {alive ? "streak" : "— check in"}
        </p>
      </div>
    </div>
  );
}

export default StreakFlame;
