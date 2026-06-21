"use client";

// ─────────────────────────────────────────────────────────────────────────────
// RewardToast + useRewardToasts — a tiny, self-contained toast system. Pages call
// `push({...})` to fly a little glass pill up from the bottom-right; it auto-
// dismisses. The hook owns the queue and exposes a <ToastViewport/> the page
// drops anywhere (it renders fixed, page-local — no root-layout changes). Toasts
// stack and stagger out. Reduced-motion safe (slide collapses to a fade).
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

export type ToastTone = "points" | "streak" | "badge" | "success";

export interface RewardToast {
  id: number;
  icon: string;
  message: string;
  tone: ToastTone;
}

const TONES: Record<ToastTone, string> = {
  points: "border-canopy/35 text-canopy-soft",
  streak: "border-warn/40 text-warn",
  badge: "border-leaf/40 text-leaf",
  success: "border-tide/40 text-tide",
};

const DEFAULT_TTL = 3200;

/** Queue + controls for reward toasts. Mount `viewport` once per page. */
export function useRewardToasts(ttl = DEFAULT_TTL) {
  const [toasts, setToasts] = useState<RewardToast[]>([]);
  const seq = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<RewardToast, "id">) => {
      const id = ++seq.current;
      setToasts((prev) => [...prev, { ...toast, id }]);
      window.setTimeout(() => remove(id), ttl);
    },
    [remove, ttl],
  );

  const viewport = <ToastViewport toasts={toasts} onDismiss={remove} />;

  return { push, viewport };
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: RewardToast[];
  onDismiss: (id: number) => void;
}) {
  const reduce = useReducedMotion();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[110] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            type="button"
            onClick={() => onDismiss(t.id)}
            layout={!reduce}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className={cn(
              "glass-strong pointer-events-auto flex items-center gap-2.5 rounded-full border py-2.5 pl-3 pr-4",
              "text-sm font-semibold shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]",
              TONES[t.tone],
            )}
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10">
              <Icon name={t.icon} size={14} />
            </span>
            <span className="whitespace-nowrap text-ink">{t.message}</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default RewardToast;
