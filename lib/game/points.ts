// ─────────────────────────────────────────────────────────────────────────────
// Green Points — the single currency that drives tiers and badges. Completing
// quests is the big reward; daily check-ins keep the habit alive with a streak
// bonus that grows (but is capped so it can't run away).
// ─────────────────────────────────────────────────────────────────────────────

/** Tunable point rules. Centralised so balancing happens in one place. */
export const POINTS = {
  /** Flat reward added to every completed quest, on top of its effort scaling. */
  QUEST_BASE: 20,
  /** Points earned per unit of quest effort (effort is 1..5). */
  QUEST_PER_EFFORT: 30,
  /** Flat reward for showing up and checking in. */
  CHECKIN_BASE: 5,
  /** Bonus per consecutive streak day, layered on the base. */
  CHECKIN_PER_STREAK_DAY: 2,
  /** Ceiling on the streak bonus so long streaks stay rewarding, not absurd. */
  CHECKIN_STREAK_BONUS_CAP: 40,
} as const;

/** Points for finishing a quest: harder habits (higher effort) pay out more. */
export function pointsForQuest(effort: number): number {
  return effort * POINTS.QUEST_PER_EFFORT + POINTS.QUEST_BASE;
}

/**
 * Points for a daily check-in. `streakDays` is the streak length *after* this
 * check-in, so day 1 already carries a small bonus and momentum compounds.
 */
export function pointsForCheckIn(streakDays: number): number {
  const bonus = Math.min(
    streakDays * POINTS.CHECKIN_PER_STREAK_DAY,
    POINTS.CHECKIN_STREAK_BONUS_CAP,
  );
  return POINTS.CHECKIN_BASE + bonus;
}
