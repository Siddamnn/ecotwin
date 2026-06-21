// ─────────────────────────────────────────────────────────────────────────────
// Badges — milestone achievements. Each badge pairs presentational metadata
// (BADGES) with an unlock predicate (UNLOCK_RULES), keyed by the same id so the
// two can never drift out of sync. `evaluateBadges` returns every earned id.
// ─────────────────────────────────────────────────────────────────────────────

import type { Badge, GameStats } from "@/types";

type BadgeId =
  | "first-quest"
  | "quest-trio"
  | "quest-veteran"
  | "streak-3"
  | "streak-7"
  | "streak-30"
  | "saver-100kg"
  | "saver-1tonne"
  | "points-1000"
  | "points-3000";

/** kg saved that count as a meaningful first dent / a full tonne. */
const FIRST_SAVE_KG = 100;
const ONE_TONNE_KG = 1000;

/** Display metadata. `icon` is a lucide-react icon name. */
export const BADGES: Badge[] = [
  {
    id: "first-quest",
    name: "First Step",
    description: "Complete your first eco quest.",
    icon: "Leaf",
  },
  {
    id: "quest-trio",
    name: "Getting Going",
    description: "Complete 3 quests.",
    icon: "Target",
  },
  {
    id: "quest-veteran",
    name: "Habit Hero",
    description: "Complete 10 quests.",
    icon: "Award",
  },
  {
    id: "streak-3",
    name: "Warming Up",
    description: "Hold a 3-day check-in streak.",
    icon: "Flame",
  },
  {
    id: "streak-7",
    name: "On Fire",
    description: "Hold a 7-day check-in streak.",
    icon: "Zap",
  },
  {
    id: "streak-30",
    name: "Unstoppable",
    description: "Hold a 30-day check-in streak.",
    icon: "Sparkles",
  },
  {
    id: "saver-100kg",
    name: "Carbon Cutter",
    description: "Save your first 100 kg of CO₂e.",
    icon: "TreePine",
  },
  {
    id: "saver-1tonne",
    name: "Tonne Crusher",
    description: "Save a full tonne of CO₂e.",
    icon: "TreePine",
  },
  {
    id: "points-1000",
    name: "Green Grand",
    description: "Reach 1,000 green points.",
    icon: "Trophy",
  },
  {
    id: "points-3000",
    name: "Forest Guardian",
    description: "Reach 3,000 green points.",
    icon: "Trophy",
  },
];

/** Unlock predicates, keyed by badge id — kept exhaustive over BadgeId. */
const UNLOCK_RULES: Record<BadgeId, (s: GameStats) => boolean> = {
  "first-quest": (s) => s.completedQuests >= 1,
  "quest-trio": (s) => s.completedQuests >= 3,
  "quest-veteran": (s) => s.completedQuests >= 10,
  "streak-3": (s) => s.longestStreakDays >= 3,
  "streak-7": (s) => s.longestStreakDays >= 7,
  "streak-30": (s) => s.longestStreakDays >= 30,
  "saver-100kg": (s) => s.totalKgSaved >= FIRST_SAVE_KG,
  "saver-1tonne": (s) => s.totalKgSaved >= ONE_TONNE_KG,
  "points-1000": (s) => s.greenPoints >= 1000,
  "points-3000": (s) => s.greenPoints >= 3000,
};

/** Ids of every badge currently earned for the given stats snapshot. */
export function evaluateBadges(stats: GameStats): string[] {
  return BADGES.filter((badge) => UNLOCK_RULES[badge.id as BadgeId](stats)).map(
    (badge) => badge.id,
  );
}
