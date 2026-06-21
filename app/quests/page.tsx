"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Quests — the habit game hub. A header band with rank, green points, streak
// flame and the daily check-in; then recommended quests (rankActions, minus the
// ones already active/done), active quests you can complete, and the badge wall.
// Every reward path fires confetti + reward toasts, and a LevelUpModal on a tier
// change. Gated on hydration; redirects to /onboarding when not onboarded.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import type { RankedAction, Tier } from "@/types";
import { rankActions } from "@/lib/actions/rank";
import { getAction } from "@/lib/actions/catalog";
import { BADGES } from "@/lib/game";
import { useAppStore, useHydrated } from "@/lib/store/useAppStore";
import { formatCo2 } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { CountUp } from "@/components/ui/CountUp";
import { Icon } from "@/components/ui/Icon";
import { TierBadge } from "@/components/game/TierBadge";
import { StreakFlame } from "@/components/game/StreakFlame";
import { BadgeGrid } from "@/components/game/BadgeGrid";
import { LevelUpModal } from "@/components/game/LevelUpModal";
import { useCelebrate } from "@/components/game/useCelebrate";
import { useRewardToasts } from "@/components/game/RewardToast";
import { QuestCard } from "@/components/quests/QuestCard";

const MAX_RECOMMENDED = 5;
const BADGES_BY_ID = new Map(BADGES.map((b) => [b.id, b.name]));

/** Name a freshly-unlocked badge for toast copy (generic fallback). */
function badgeName(id: string): string {
  return BADGES_BY_ID.get(id) ?? "Unlocked";
}

function SectionTitle({
  icon,
  title,
  hint,
}: {
  icon: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon name={icon} size={18} className="text-canopy" />
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {hint && <span className="ml-auto text-xs text-faint">{hint}</span>}
    </div>
  );
}

function EmptyState({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/8 px-6 py-10 text-center">
      <Icon name={icon} size={26} className="text-faint" />
      <p className="max-w-xs text-sm text-muted">{children}</p>
    </div>
  );
}

function QuestsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="skeleton h-36 rounded-3xl" />
      <div className="skeleton h-8 w-48 rounded-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-52 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function QuestsPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const onboarded = useAppStore((s) => s.onboarded);
  const twin = useAppStore((s) => s.twin);
  const game = useAppStore((s) => s.game);
  const checkIn = useAppStore((s) => s.checkIn);
  const acceptQuest = useAppStore((s) => s.acceptQuest);
  const abandonQuest = useAppStore((s) => s.abandonQuest);
  const completeQuest = useAppStore((s) => s.completeQuest);

  const celebrate = useCelebrate();
  const { push, viewport } = useRewardToasts();

  const [levelTier, setLevelTier] = useState<Tier | null>(null);

  useEffect(() => {
    if (hydrated && !onboarded) router.replace("/onboarding");
  }, [hydrated, onboarded, router]);

  // recommended = ranked actions not already active or completed
  const recommended = useMemo(() => {
    const taken = new Set([
      ...game.activeQuests.map((q) => q.questId),
      ...game.completedQuestIds,
    ]);
    return rankActions(twin)
      .filter((r) => !taken.has(r.template.id))
      .slice(0, MAX_RECOMMENDED);
  }, [twin, game.activeQuests, game.completedQuestIds]);

  // active quests rebuilt as RankedAction so cards show live savings
  const activeRanked = useMemo<RankedAction[]>(() => {
    const ranked = rankActions(twin);
    const byId = new Map(ranked.map((r) => [r.template.id, r]));
    return game.activeQuests
      .map((q) => {
        const fromRank = byId.get(q.questId);
        if (fromRank) return fromRank;
        // action no longer has an effect on this twin → synthesise a 0-saving card
        const template = getAction(q.questId);
        if (!template) return null;
        return {
          template,
          annualSavingKg: 0,
          annualSavingInr: 0,
          score: 0,
        } as RankedAction;
      })
      .filter((r): r is RankedAction => r !== null);
  }, [twin, game.activeQuests]);

  const alreadyToday = useMemo(() => {
    // lastCheckIn compared to today; cheap derived flag for the button label
    return game.lastCheckIn === new Date().toISOString().slice(0, 10);
  }, [game.lastCheckIn]);

  function handleCheckIn(origin?: { x: number; y: number }) {
    const res = checkIn();
    if (res.alreadyToday) return;

    celebrate("streakMilestone", origin);
    push({
      icon: "Plus",
      tone: "points",
      message: `+${res.pointsGained} green points`,
    });
    push({
      icon: "Flame",
      tone: "streak",
      message: `🔥 ${res.streakDays}-day streak`,
    });
    res.newBadgeIds.forEach((id) => {
      push({ icon: "Award", tone: "badge", message: `🏅 Badge: ${badgeName(id)}` });
    });
    if (res.leveledUp && res.newTier) setLevelTier(res.newTier);
  }

  function handleAccept(action: RankedAction, origin?: { x: number; y: number }) {
    acceptQuest(action.template.id);
    celebrate("badgeUnlock", origin);
    push({
      icon: "Target",
      tone: "success",
      message: `Quest accepted: ${action.template.title}`,
    });
  }

  function handleComplete(action: RankedAction, origin?: { x: number; y: number }) {
    const res = completeQuest(action.template.id);
    if (!res.ok) return;

    celebrate("questComplete", origin);
    if (res.leveledUp) celebrate("levelUp", origin);

    push({ icon: "Plus", tone: "points", message: `+${res.pointsGained} green points` });
    if (res.savedKg > 0) {
      push({ icon: "Leaf", tone: "success", message: `−${formatCo2(res.savedKg)}/yr saved` });
    }
    res.newBadgeIds.forEach((id) => {
      push({ icon: "Award", tone: "badge", message: `🏅 Badge: ${badgeName(id)}` });
    });
    if (res.leveledUp && res.newTier) setLevelTier(res.newTier);
  }

  if (!hydrated || !onboarded) {
    return (
      <div className="py-2">
        <QuestsSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-2">
      {/* ── header band: rank · points · streak · check-in ─────────────────── */}
      <GlassCard strong glow className="relative overflow-hidden">
        <div className="bg-grain absolute inset-0 -z-10 opacity-[0.07]" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
            <TierBadge points={game.greenPoints} />

            <div className="h-12 w-px bg-white/8 max-sm:hidden" />

            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-faint">
                Green points
              </p>
              <p className="font-mono text-3xl font-bold tabular-nums text-gradient">
                <CountUp value={game.greenPoints} />
              </p>
            </div>

            <div className="h-12 w-px bg-white/8 max-sm:hidden" />

            <StreakFlame days={game.currentStreakDays} />
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <Button
              size="lg"
              variant={alreadyToday ? "secondary" : "primary"}
              disabled={alreadyToday}
              onClick={(e) => handleCheckIn({ x: e.clientX, y: e.clientY })}
            >
              <Icon name={alreadyToday ? "CheckCheck" : "CalendarCheck"} size={18} />
              {alreadyToday ? "Checked in ✓" : "Daily check-in"}
            </Button>
            <p className="text-center text-xs text-faint sm:text-right">
              {alreadyToday
                ? "Come back tomorrow to keep the flame alive."
                : "Show up daily — your streak compounds the bonus."}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* ── recommended quests ─────────────────────────────────────────────── */}
      <section>
        <SectionTitle
          icon="Sparkles"
          title="Recommended for you"
          hint="Highest impact per effort"
        />
        {recommended.length === 0 ? (
          <EmptyState icon="PartyPopper">
            You&apos;ve taken on every high-leverage quest we found. Complete a few,
            then check back for fresh recommendations.
          </EmptyState>
        ) : (
          <motion.div
            layout
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {recommended.map((action) => (
                <QuestCard
                  key={action.template.id}
                  action={action}
                  mode="recommend"
                  onAction={(origin) => handleAccept(action, origin)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      {/* ── active quests ──────────────────────────────────────────────────── */}
      <section>
        <SectionTitle
          icon="ListChecks"
          title="Active quests"
          hint={activeRanked.length ? `${activeRanked.length} in progress` : undefined}
        />
        {activeRanked.length === 0 ? (
          <EmptyState icon="Compass">
            No active quests yet. Accept one above and it&apos;ll land here, ready to
            complete.
          </EmptyState>
        ) : (
          <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {activeRanked.map((action) => (
                <QuestCard
                  key={action.template.id}
                  action={action}
                  mode="active"
                  onAction={(origin) => handleComplete(action, origin)}
                  onAbandon={() => abandonQuest(action.template.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      {/* ── badges ─────────────────────────────────────────────────────────── */}
      <section>
        <SectionTitle
          icon="Award"
          title="Badges"
          hint={`${game.completedQuestIds.length} quest${
            game.completedQuestIds.length === 1 ? "" : "s"
          } completed`}
        />
        <GlassCard>
          <BadgeGrid unlockedIds={game.unlockedBadgeIds} />
        </GlassCard>
      </section>

      {/* page-local overlays */}
      {viewport}
      <LevelUpModal
        open={levelTier !== null}
        tier={levelTier}
        onClose={() => setLevelTier(null)}
      />
    </div>
  );
}
