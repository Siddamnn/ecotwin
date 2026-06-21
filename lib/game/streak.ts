// ─────────────────────────────────────────────────────────────────────────────
// Streaks — daily check-in continuity with one forgiving "streak protection"
// day. Pure: every decision is derived from the two date strings passed in.
// ─────────────────────────────────────────────────────────────────────────────

import type { GameState } from "@/types";
import { daysBetween } from "@/lib/utils";

/** Gap (in days) that is silently forgiven without breaking the streak. */
const GRACE_GAP = 2;

/**
 * Resolve the streak after a check-in on `today` (yyyy-mm-dd).
 *
 * Rules:
 *  - already checked in today        → no change
 *  - first-ever check-in             → streak = 1
 *  - consecutive day (gap 1)         → streak + 1
 *  - exactly one day missed (gap 2)  → one grace day: streak unchanged, kept alive
 *  - larger gap                      → streak resets to 1
 * `longestStreakDays` always tracks the high-water mark.
 */
export function updateStreak(
  game: GameState,
  today: string,
): {
  currentStreakDays: number;
  longestStreakDays: number;
  lastCheckIn: string;
} {
  const { lastCheckIn, currentStreakDays, longestStreakDays } = game;

  const next = resolveStreakLength(lastCheckIn, today, currentStreakDays);

  return {
    currentStreakDays: next,
    longestStreakDays: Math.max(longestStreakDays, next),
    lastCheckIn: lastCheckIn === today ? lastCheckIn : today,
  };
}

/** Map the gap since the last check-in to the new streak length. */
function resolveStreakLength(
  lastCheckIn: string | null,
  today: string,
  currentStreakDays: number,
): number {
  if (lastCheckIn === null) return 1;
  if (lastCheckIn === today) return currentStreakDays;

  const gap = daysBetween(lastCheckIn, today);
  if (gap === 1) return currentStreakDays + 1;
  if (gap === GRACE_GAP) return currentStreakDays; // protected: kept, not grown
  return 1; // bigger gap (or a non-positive/odd value) → fresh streak
}
