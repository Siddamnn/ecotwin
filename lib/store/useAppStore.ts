// ─────────────────────────────────────────────────────────────────────────────
// The single source of truth for app state — persisted to localStorage. This is
// where the Twin (lifestyle), the emission engine, and the game system meet.
//
// UI components read state with selectors and call the action methods below;
// the mutating actions return rich "result" objects so the UI can fire the
// right celebration (confetti / level-up / badge unlock).
// ─────────────────────────────────────────────────────────────────────────────

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { GameState, GameStats, Tier, Twin } from "@/types";
import { calculate } from "@/lib/emissions/calculate";
import { SUSTAINABLE_TARGET_KG } from "@/lib/emissions/factors";
import { getAction } from "@/lib/actions/catalog";
import {
  evaluateBadges,
  getTier,
  pointsForCheckIn,
  pointsForQuest,
  updateStreak,
} from "@/lib/game";
import { DEFAULT_TWIN } from "@/lib/constants";
import { todayIso } from "@/lib/utils";

// ── result types returned by mutating actions ───────────────────────────────
export interface CheckInResult {
  alreadyToday: boolean;
  pointsGained: number;
  streakDays: number;
  leveledUp: boolean;
  newTier?: Tier;
  newBadgeIds: string[];
}

export interface CompleteQuestResult {
  ok: boolean;
  pointsGained: number;
  savedKg: number;
  leveledUp: boolean;
  newTier?: Tier;
  newBadgeIds: string[];
}

const INITIAL_GAME: GameState = {
  greenPoints: 0,
  currentStreakDays: 0,
  longestStreakDays: 0,
  lastCheckIn: null,
  unlockedBadgeIds: [],
  activeQuests: [],
  completedQuestIds: [],
  footprintHistory: [],
};

// ── persisted shape + full store interface ──────────────────────────────────
interface PersistedState {
  onboarded: boolean;
  twin: Twin;
  baselineKg: number;
  targetKg: number;
  game: GameState;
}

interface AppStore extends PersistedState {
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  completeOnboarding: (twin: Twin) => void;
  updateTwin: (twin: Twin) => void;
  setTarget: (kg: number) => void;

  checkIn: () => CheckInResult;
  acceptQuest: (actionId: string) => void;
  abandonQuest: (actionId: string) => void;
  completeQuest: (actionId: string) => CompleteQuestResult;

  resetAll: () => void;
}

// ── helpers ──────────────────────────────────────────────────────────────────
function gameStats(game: GameState, baselineKg: number, currentKg: number): GameStats {
  return {
    greenPoints: game.greenPoints,
    currentStreakDays: game.currentStreakDays,
    longestStreakDays: game.longestStreakDays,
    completedQuests: game.completedQuestIds.length,
    totalKgSaved: Math.max(0, baselineKg - currentKg),
  };
}

/** Insert or replace today's footprint point so the trend has one entry per day. */
function upsertTodayPoint(history: GameState["footprintHistory"], totalKg: number) {
  const today = todayIso();
  const rest = history.filter((p) => p.date !== today);
  return [...rest, { date: today, totalKg }];
}

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

// ── store ────────────────────────────────────────────────────────────────────
export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      onboarded: false,
      twin: DEFAULT_TWIN,
      baselineKg: 0,
      targetKg: SUSTAINABLE_TARGET_KG,
      game: INITIAL_GAME,
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      completeOnboarding: (twin) => {
        const baseline = calculate(twin).total;
        set({
          onboarded: true,
          twin,
          baselineKg: baseline,
          targetKg: Math.round(Math.max(SUSTAINABLE_TARGET_KG, baseline * 0.7)),
          game: {
            ...INITIAL_GAME,
            footprintHistory: [{ date: todayIso(), totalKg: baseline }],
          },
        });
      },

      updateTwin: (twin) => {
        const total = calculate(twin).total;
        set((s) => ({
          twin,
          game: { ...s.game, footprintHistory: upsertTodayPoint(s.game.footprintHistory, total) },
        }));
      },

      setTarget: (kg) => set({ targetKg: Math.max(0, Math.round(kg)) }),

      checkIn: () => {
        const { game, baselineKg, twin } = get();
        const today = todayIso();
        if (game.lastCheckIn === today) {
          return {
            alreadyToday: true,
            pointsGained: 0,
            streakDays: game.currentStreakDays,
            leveledUp: false,
            newBadgeIds: [],
          };
        }

        const streak = updateStreak(game, today);
        const gained = pointsForCheckIn(streak.currentStreakDays);
        const prevPoints = game.greenPoints;
        const newPoints = prevPoints + gained;

        const nextGame: GameState = {
          ...game,
          ...streak,
          greenPoints: newPoints,
        };
        const stats = gameStats(nextGame, baselineKg, calculate(twin).total);
        const earned = evaluateBadges(stats);
        const newBadgeIds = earned.filter((id) => !game.unlockedBadgeIds.includes(id));
        nextGame.unlockedBadgeIds = earned;

        const fromTier = getTier(prevPoints);
        const toTier = getTier(newPoints);
        const leveledUp = fromTier.id !== toTier.id;

        set({ game: nextGame });
        return {
          alreadyToday: false,
          pointsGained: gained,
          streakDays: streak.currentStreakDays,
          leveledUp,
          newTier: leveledUp ? toTier : undefined,
          newBadgeIds,
        };
      },

      acceptQuest: (actionId) => {
        const { game } = get();
        const action = getAction(actionId);
        if (!action) return;
        const already =
          game.activeQuests.some((q) => q.questId === actionId) ||
          game.completedQuestIds.includes(actionId);
        if (already) return;

        set({
          game: {
            ...game,
            activeQuests: [
              ...game.activeQuests,
              {
                questId: actionId,
                acceptedAt: todayIso(),
                target: action.quest.target,
                progress: 0,
                status: "active",
              },
            ],
          },
        });
      },

      abandonQuest: (actionId) => {
        const { game } = get();
        set({
          game: {
            ...game,
            activeQuests: game.activeQuests.filter((q) => q.questId !== actionId),
          },
        });
      },

      completeQuest: (actionId) => {
        const state = get();
        const action = getAction(actionId);
        const quest = state.game.activeQuests.find(
          (q) => q.questId === actionId && q.status === "active",
        );
        if (!action || !quest) {
          return {
            ok: false,
            pointsGained: 0,
            savedKg: 0,
            leveledUp: false,
            newBadgeIds: [],
          };
        }

        const before = calculate(state.twin).total;
        const newTwin = action.apply(state.twin);
        const after = calculate(newTwin).total;
        const savedKg = Math.max(0, before - after);

        const gained = pointsForQuest(action.effort);
        const prevPoints = state.game.greenPoints;
        const newPoints = prevPoints + gained;

        const nextGame: GameState = {
          ...state.game,
          greenPoints: newPoints,
          activeQuests: state.game.activeQuests.filter((q) => q.questId !== actionId),
          completedQuestIds: [...state.game.completedQuestIds, actionId],
          footprintHistory: upsertTodayPoint(state.game.footprintHistory, after),
        };

        const stats = gameStats(nextGame, state.baselineKg, after);
        const earned = evaluateBadges(stats);
        const newBadgeIds = earned.filter((id) => !state.game.unlockedBadgeIds.includes(id));
        nextGame.unlockedBadgeIds = earned;

        const fromTier = getTier(prevPoints);
        const toTier = getTier(newPoints);
        const leveledUp = fromTier.id !== toTier.id;

        set({ twin: newTwin, game: nextGame });
        return {
          ok: true,
          pointsGained: gained,
          savedKg,
          leveledUp,
          newTier: leveledUp ? toTier : undefined,
          newBadgeIds,
        };
      },

      resetAll: () =>
        set({
          onboarded: false,
          twin: DEFAULT_TWIN,
          baselineKg: 0,
          targetKg: SUSTAINABLE_TARGET_KG,
          game: INITIAL_GAME,
        }),
    }),
    {
      name: "ecotwin-store",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : noopStorage,
      ),
      partialize: (s) => ({
        onboarded: s.onboarded,
        twin: s.twin,
        baselineKg: s.baselineKg,
        targetKg: s.targetKg,
        game: s.game,
      }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);

/** True once localStorage has been read on the client (gate rendering on this). */
export function useHydrated(): boolean {
  return useAppStore((s) => s._hasHydrated);
}
