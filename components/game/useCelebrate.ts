"use client";

// ─────────────────────────────────────────────────────────────────────────────
// useCelebrate — the confetti cannon. Returns `celebrate(event, originXY?)` that
// fires a burst tuned by CELEBRATIONS (particle count / spread) in BRAND_COLORS.
// canvas-confetti is LAZY-loaded on first fire so it never bloats the initial
// bundle. A no-op under reduced motion. `originXY` (viewport px) lets a button
// launch the burst from where it was clicked.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useRef } from "react";
import { useReducedMotion } from "framer-motion";

import { CELEBRATIONS, BRAND_COLORS } from "@/lib/game";

type ConfettiFn = (opts: Record<string, unknown>) => void;

export type CelebrationEvent = keyof typeof CELEBRATIONS;

export function useCelebrate() {
  const reduce = useReducedMotion();
  // cache the lazily-imported module across calls
  const confettiRef = useRef<ConfettiFn | null>(null);

  const load = useCallback(async (): Promise<ConfettiFn> => {
    if (confettiRef.current) return confettiRef.current;
    const mod = await import("canvas-confetti");
    confettiRef.current = mod.default as unknown as ConfettiFn;
    return confettiRef.current;
  }, []);

  const celebrate = useCallback(
    async (event: CelebrationEvent, originXY?: { x: number; y: number }) => {
      if (reduce) return; // honour prefers-reduced-motion

      const cfg = CELEBRATIONS[event];
      const confetti = await load();

      // origin in normalized [0,1] coords; default = slightly above centre
      const origin = originXY
        ? {
            x: originXY.x / window.innerWidth,
            y: originXY.y / window.innerHeight,
          }
        : { x: 0.5, y: 0.42 };

      const base = {
        particleCount: cfg.confettiParticles,
        spread: cfg.confettiSpread,
        colors: BRAND_COLORS,
        origin,
        startVelocity: 42,
        ticks: Math.round(cfg.durationMs / 16),
        scalar: 1.05,
        zIndex: 9999,
        disableForReducedMotion: true,
      };

      // Big moments get a layered double-burst for extra "pop".
      const big = event === "levelUp" || event === "questComplete";
      confetti({ ...base });
      if (big) {
        confetti({
          ...base,
          particleCount: Math.round(cfg.confettiParticles * 0.5),
          spread: cfg.confettiSpread + 30,
          startVelocity: 28,
          scalar: 0.8,
          origin: { x: origin.x, y: Math.min(0.9, origin.y + 0.05) },
        });
      }
    },
    [reduce, load],
  );

  return celebrate;
}

export default useCelebrate;
