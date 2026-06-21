// ─────────────────────────────────────────────────────────────────────────────
// Tiers — the visible progression ladder. Points map to a nature-themed tier;
// the UI renders the tier badge and a progress bar toward the next threshold.
// ─────────────────────────────────────────────────────────────────────────────

import type { Tier } from "@/types";
import { clamp } from "@/lib/utils";

/** Five tiers, ascending. `minPoints` is the inclusive entry threshold. */
export const TIERS: Tier[] = [
  {
    id: "seedling",
    name: "Seedling",
    minPoints: 0,
    emoji: "🌱",
    gradient: "from-lime-300 to-emerald-400",
  },
  {
    id: "sapling",
    name: "Sapling",
    minPoints: 150,
    emoji: "🌿",
    gradient: "from-emerald-400 to-teal-500",
  },
  {
    id: "sprout",
    name: "Sprout",
    minPoints: 500,
    emoji: "☘️",
    gradient: "from-teal-400 to-cyan-500",
  },
  {
    id: "tree",
    name: "Tree",
    minPoints: 1200,
    emoji: "🌳",
    gradient: "from-green-500 to-emerald-700",
  },
  {
    id: "forest",
    name: "Forest",
    minPoints: 3000,
    emoji: "🌲",
    gradient: "from-emerald-600 to-green-900",
  },
];

/** The highest tier whose threshold the points have reached. */
export function getTier(points: number): Tier {
  // TIERS is ascending, so the last one we clear is the current tier.
  let current = TIERS[0];
  for (const tier of TIERS) {
    if (points >= tier.minPoints) current = tier;
    else break;
  }
  return current;
}

/** The next tier to aim for, or null when already at the top. */
export function getNextTier(points: number): Tier | null {
  return TIERS.find((tier) => tier.minPoints > points) ?? null;
}

/** Current tier, next tier, and 0..1 progress toward it (1 when maxed). */
export function tierProgress(points: number): {
  current: Tier;
  next: Tier | null;
  pct: number;
} {
  const current = getTier(points);
  const next = getNextTier(points);
  if (!next) return { current, next: null, pct: 1 };

  const span = next.minPoints - current.minPoints;
  const pct = clamp((points - current.minPoints) / span, 0, 1);
  return { current, next, pct };
}
