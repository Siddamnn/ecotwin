"use client";

// ─────────────────────────────────────────────────────────────────────────────
// OptionCard — a springy, selectable card used across the wizard for the
// emoji-led option grids (diet, car, consumption). Generic over the value type.
// ─────────────────────────────────────────────────────────────────────────────

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

export interface OptionCardProps<T extends string> {
  value: T;
  selected: boolean;
  onSelect: (value: T) => void;
  emoji?: string;
  label: string;
  hint?: string;
  className?: string;
}

export function OptionCard<T extends string>({
  value,
  selected,
  onSelect,
  emoji,
  label,
  hint,
  className,
}: OptionCardProps<T>) {
  const reduce = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={selected}
      whileHover={reduce ? undefined : { y: -3 }}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      className={cn(
        "relative flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-colors",
        "outline-none focus-visible:ring-2 focus-visible:ring-canopy/60",
        selected
          ? "border-canopy/50 bg-canopy/10 shadow-[0_8px_30px_-12px_rgba(52,211,153,0.5)]"
          : "border-white/8 glass hover:border-white/20",
        className,
      )}
    >
      {emoji && <span className="text-2xl leading-none">{emoji}</span>}
      <span className={cn("text-sm font-semibold", selected ? "text-canopy-soft" : "text-ink")}>
        {label}
      </span>
      {hint && <span className="text-xs leading-snug text-faint">{hint}</span>}

      {selected && (
        <motion.span
          layoutId="opt-check"
          className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-canopy to-tide text-[#04130c]"
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.5L5 9L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.span>
      )}
    </motion.button>
  );
}

export default OptionCard;
