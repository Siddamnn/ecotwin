// ─────────────────────────────────────────────────────────────────────────────
// Juice — the "game feel" spec. Pure data the UI consumes to fire confetti and
// toast copy on rewarding moments. No side effects here; the UI owns the cannon.
// Intensity, by design: levelUp > questComplete > badgeUnlock > streakMilestone.
// ─────────────────────────────────────────────────────────────────────────────

/** Confetti palette — EcoTwin greens, lime, teal, sky. */
export const BRAND_COLORS: string[] = [
  "#34d399",
  "#a3e635",
  "#2dd4bf",
  "#6ee7b7",
  "#38bdf8",
];

/** One celebratory event's tuning + copy. */
export interface Celebration {
  confettiParticles: number;
  confettiSpread: number;
  durationMs: number;
  message: string;
  emoji: string;
}

/** Per-event celebration configs the UI plays back. */
export const CELEBRATIONS = {
  levelUp: {
    confettiParticles: 220,
    confettiSpread: 140,
    durationMs: 2600,
    message: "Level up! A new tier unlocked.",
    emoji: "🌳",
  },
  questComplete: {
    confettiParticles: 140,
    confettiSpread: 100,
    durationMs: 1800,
    message: "Quest complete! Greener already.",
    emoji: "✅",
  },
  badgeUnlock: {
    confettiParticles: 90,
    confettiSpread: 80,
    durationMs: 1500,
    message: "Badge unlocked!",
    emoji: "🏅",
  },
  streakMilestone: {
    confettiParticles: 70,
    confettiSpread: 70,
    durationMs: 1300,
    message: "Streak milestone — keep it alive!",
    emoji: "🔥",
  },
} satisfies Record<string, Celebration>;

/** Look up the celebration config for an event. */
export function celebrationFor(
  event: keyof typeof CELEBRATIONS,
): Celebration {
  return CELEBRATIONS[event];
}
