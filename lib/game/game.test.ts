// Tests for the pure gamification logic. Dates are passed in explicitly, so
// every case is deterministic.

import { describe, expect, it } from "vitest";
import type { GameState, GameStats } from "@/types";

import {
  TIERS,
  getTier,
  getNextTier,
  tierProgress,
} from "./levels";
import { pointsForQuest, pointsForCheckIn, POINTS } from "./points";
import { updateStreak } from "./streak";
import { BADGES, evaluateBadges } from "./badges";
import { CELEBRATIONS, celebrationFor } from "./juice";

/** Minimal GameState fixture; override only the fields a test cares about. */
function gameState(over: Partial<GameState> = {}): GameState {
  return {
    greenPoints: 0,
    currentStreakDays: 0,
    longestStreakDays: 0,
    lastCheckIn: null,
    unlockedBadgeIds: [],
    activeQuests: [],
    completedQuestIds: [],
    footprintHistory: [],
    ...over,
  };
}

function stats(over: Partial<GameStats> = {}): GameStats {
  return {
    greenPoints: 0,
    currentStreakDays: 0,
    longestStreakDays: 0,
    completedQuests: 0,
    totalKgSaved: 0,
    ...over,
  };
}

describe("levels", () => {
  it("maps points to the right tier", () => {
    expect(getTier(0).id).toBe("seedling");
    expect(getTier(149).id).toBe("seedling");
    expect(getTier(150).id).toBe("sapling");
    expect(getTier(2999).id).toBe("tree");
    expect(getTier(3000).id).toBe("forest");
    expect(getTier(999_999).id).toBe("forest");
  });

  it("returns the next tier, null at the top", () => {
    expect(getNextTier(0)?.id).toBe("sapling");
    expect(getNextTier(3000)).toBeNull();
  });

  it("reports fractional progress toward the next tier", () => {
    // halfway between seedling (0) and sapling (150)
    expect(tierProgress(75).pct).toBeCloseTo(0.5);
    expect(tierProgress(0).pct).toBe(0);
    const maxed = tierProgress(5000);
    expect(maxed.next).toBeNull();
    expect(maxed.pct).toBe(1);
  });

  it("has five ascending tiers", () => {
    const mins = TIERS.map((t) => t.minPoints);
    expect(mins).toEqual([...mins].sort((a, b) => a - b));
    expect(TIERS).toHaveLength(5);
  });
});

describe("points", () => {
  it("scales quest reward with effort", () => {
    expect(pointsForQuest(1)).toBe(POINTS.QUEST_PER_EFFORT + POINTS.QUEST_BASE);
    expect(pointsForQuest(5)).toBeGreaterThan(pointsForQuest(1));
  });

  it("rewards check-ins with a capped streak bonus", () => {
    expect(pointsForCheckIn(1)).toBeGreaterThan(POINTS.CHECKIN_BASE);
    const huge = pointsForCheckIn(1000);
    expect(huge).toBe(POINTS.CHECKIN_BASE + POINTS.CHECKIN_STREAK_BONUS_CAP);
  });
});

describe("updateStreak", () => {
  it("starts a streak at 1 on the first check-in", () => {
    const r = updateStreak(gameState(), "2026-06-21");
    expect(r.currentStreakDays).toBe(1);
    expect(r.longestStreakDays).toBe(1);
    expect(r.lastCheckIn).toBe("2026-06-21");
  });

  it("is a no-op when already checked in today", () => {
    const g = gameState({ lastCheckIn: "2026-06-21", currentStreakDays: 4, longestStreakDays: 9 });
    const r = updateStreak(g, "2026-06-21");
    expect(r.currentStreakDays).toBe(4);
    expect(r.longestStreakDays).toBe(9);
  });

  it("increments on a consecutive day", () => {
    const g = gameState({ lastCheckIn: "2026-06-20", currentStreakDays: 4, longestStreakDays: 4 });
    const r = updateStreak(g, "2026-06-21");
    expect(r.currentStreakDays).toBe(5);
    expect(r.longestStreakDays).toBe(5);
  });

  it("applies one grace day when exactly one day was missed", () => {
    const g = gameState({ lastCheckIn: "2026-06-19", currentStreakDays: 4, longestStreakDays: 6 });
    const r = updateStreak(g, "2026-06-21"); // missed the 20th
    expect(r.currentStreakDays).toBe(4); // kept, not incremented
    expect(r.longestStreakDays).toBe(6);
  });

  it("resets to 1 after a bigger gap", () => {
    const g = gameState({ lastCheckIn: "2026-06-10", currentStreakDays: 8, longestStreakDays: 8 });
    const r = updateStreak(g, "2026-06-21");
    expect(r.currentStreakDays).toBe(1);
    expect(r.longestStreakDays).toBe(8);
  });
});

describe("badges", () => {
  it("unlocks nothing for a fresh player", () => {
    expect(evaluateBadges(stats())).toEqual([]);
  });

  it("unlocks the badges whose thresholds are met", () => {
    const earned = evaluateBadges(
      stats({ completedQuests: 3, longestStreakDays: 7, totalKgSaved: 100, greenPoints: 1000 }),
    );
    expect(earned).toContain("first-quest");
    expect(earned).toContain("quest-trio");
    expect(earned).toContain("streak-7");
    expect(earned).toContain("saver-100kg");
    expect(earned).toContain("points-1000");
    expect(earned).not.toContain("quest-veteran");
    expect(earned).not.toContain("saver-1tonne");
  });

  it("keeps every BADGE id matched by a predicate", () => {
    // A maxed-out player should earn literally every badge.
    const all = evaluateBadges(
      stats({ completedQuests: 99, longestStreakDays: 99, totalKgSaved: 5000, greenPoints: 9999 }),
    );
    expect(all.sort()).toEqual(BADGES.map((b) => b.id).sort());
  });
});

describe("juice", () => {
  it("orders intensity levelUp > questComplete > badgeUnlock", () => {
    expect(CELEBRATIONS.levelUp.confettiParticles).toBeGreaterThan(
      CELEBRATIONS.questComplete.confettiParticles,
    );
    expect(CELEBRATIONS.questComplete.confettiParticles).toBeGreaterThan(
      CELEBRATIONS.badgeUnlock.confettiParticles,
    );
  });

  it("looks up a celebration by event key", () => {
    expect(celebrationFor("levelUp")).toBe(CELEBRATIONS.levelUp);
  });
});
