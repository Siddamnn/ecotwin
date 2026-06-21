"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BadgeGrid — every BADGE as a tile. Locked badges are dimmed + grayscale with a
// little padlock; unlocked badges burst in with a spring pop, carry a coloured
// gradient ring, a diagonal shimmer sweep, and show their description. Tiles
// stagger-reveal on mount. Deterministic (no Math.random in render).
// ─────────────────────────────────────────────────────────────────────────────

import { motion, useReducedMotion } from "framer-motion";

import { BADGES } from "@/lib/game";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

export interface BadgeGridProps {
  unlockedIds: string[];
  className?: string;
}

export function BadgeGrid({ unlockedIds, className }: BadgeGridProps) {
  const reduce = useReducedMotion();
  const unlocked = new Set(unlockedIds);

  return (
    <motion.div
      className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5", className)}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
    >
      {BADGES.map((badge) => {
        const isUnlocked = unlocked.has(badge.id);
        return (
          <motion.div
            key={badge.id}
            variants={{
              hidden: { opacity: 0, y: 16, scale: 0.92 },
              show: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: reduce
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 300, damping: 20 },
              },
            }}
            whileHover={reduce ? undefined : { y: -4, scale: 1.03 }}
            className={cn(
              "group relative flex flex-col items-center overflow-hidden rounded-2xl border p-4 text-center transition-colors",
              isUnlocked
                ? "border-canopy/30 bg-canopy/[0.06]"
                : "border-white/5 bg-white/[0.02]",
            )}
          >
            {/* shimmer sweep on unlocked tiles (loops; reveals the "earned" sheen) */}
            {isUnlocked && !reduce && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                initial={{ x: "-160%" }}
                animate={{ x: "320%" }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  repeatDelay: 3.5,
                  ease: "easeInOut",
                }}
              />
            )}

            <div
              className={cn(
                "grid h-12 w-12 place-items-center rounded-xl",
                isUnlocked
                  ? "bg-gradient-to-br from-canopy to-tide text-[#04130c] shadow-[0_6px_18px_-6px_rgba(52,211,153,0.6)]"
                  : "bg-white/5 text-faint grayscale",
              )}
            >
              <Icon name={isUnlocked ? badge.icon : "Lock"} size={22} />
            </div>

            <p
              className={cn(
                "mt-3 text-sm font-semibold",
                isUnlocked ? "text-ink" : "text-muted",
              )}
            >
              {badge.name}
            </p>
            <p
              className={cn(
                "mt-1 text-[0.7rem] leading-snug",
                isUnlocked ? "text-muted" : "text-faint/80",
              )}
            >
              {isUnlocked ? badge.description : "Locked"}
            </p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default BadgeGrid;
