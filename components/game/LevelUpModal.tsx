"use client";

// ─────────────────────────────────────────────────────────────────────────────
// LevelUpModal — the big celebratory moment when a new tier unlocks. A spring-in
// glass dialog with the new tier emoji on its gradient, the tier name, and a
// confetti burst fired on mount. Controlled (open / tier / onClose). Rendered as
// a fixed overlay so it stays page-local (no root-layout edits). Reduced-motion
// safe via useCelebrate (no-op) and AnimatePresence collapsing to instant.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import type { Tier } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useCelebrate } from "./useCelebrate";

export interface LevelUpModalProps {
  open: boolean;
  tier: Tier | null;
  onClose: () => void;
}

export function LevelUpModal({ open, tier, onClose }: LevelUpModalProps) {
  const reduce = useReducedMotion();
  const celebrate = useCelebrate();

  // fire confetti once each time the modal opens with a tier
  useEffect(() => {
    if (open && tier) celebrate("levelUp");
  }, [open, tier, celebrate]);

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && tier && (
        <motion.div
          className="fixed inset-0 z-[120] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-label={`Level up to ${tier.name}`}
        >
          {/* scrim */}
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            className="glass-strong glow-canopy relative w-full max-w-sm overflow-hidden rounded-[1.75rem] p-8 text-center"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
          >
            {/* ambient sweep behind the emoji */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-10 -z-10 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl"
              style={{ background: "radial-gradient(circle, rgba(52,211,153,0.5), transparent 70%)" }}
            />

            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-leaf">
              Level up
            </p>

            <motion.div
              className={cn(
                "mx-auto mt-5 grid h-28 w-28 place-items-center rounded-full text-6xl",
                "bg-gradient-to-br shadow-[0_12px_44px_-10px_rgba(52,211,153,0.7)]",
                tier.gradient,
              )}
              initial={reduce ? false : { scale: 0, rotate: -25 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 14, delay: 0.1 }}
            >
              <motion.span
                animate={reduce ? undefined : { y: [0, -6, 0] }}
                transition={reduce ? undefined : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                {tier.emoji}
              </motion.span>
            </motion.div>

            <h2 className="mt-6 text-2xl font-bold text-ink">
              You&apos;re a <span className="text-gradient">{tier.name}</span>
            </h2>
            <p className="mt-2 text-sm text-muted">
              Your twin just grew. Keep the streak alive and the next tier is yours.
            </p>

            <Button className="mt-7 w-full" size="lg" onClick={onClose}>
              Keep growing
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LevelUpModal;
