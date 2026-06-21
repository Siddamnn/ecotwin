"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ProgressRing — circular SVG progress with an animated stroke-dashoffset and a
// gradient stroke. Optional center label/children. `progress` is 0..1.
// Reduced-motion safe (the stroke snaps instead of sweeping).
// ─────────────────────────────────────────────────────────────────────────────

import { useId, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

export interface ProgressRingProps {
  /** 0..1 fill. */
  progress: number;
  size?: number;
  /** Stroke width in px (default 10). */
  stroke?: number;
  /** Gradient endpoints (CSS colors). */
  from?: string;
  to?: string;
  /** Color of the unfilled track. */
  trackColor?: string;
  /** Center content (label, value …). */
  children?: ReactNode;
  className?: string;
}

export function ProgressRing({
  progress,
  size = 132,
  stroke = 10,
  from = "var(--color-canopy)",
  to = "var(--color-tide)",
  trackColor = "rgba(255,255,255,0.08)",
  children,
  className,
}: ProgressRingProps) {
  const reduce = useReducedMotion();
  const clamped = Math.max(0, Math.min(1, progress));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  // Stable, unique gradient id per instance (avoids SVG <defs> collisions).
  const gid = `eco-ring-${useId()}`;

  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - clamped) }}
          transition={
            reduce
              ? { duration: 0 }
              : { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
          }
          style={{ filter: "drop-shadow(0 0 6px rgba(52,211,153,0.4))" }}
        />
      </svg>
      {children != null && (
        <div className="absolute inset-0 grid place-items-center text-center">
          {children}
        </div>
      )}
    </div>
  );
}

export default ProgressRing;
