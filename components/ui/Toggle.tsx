"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Toggle — an animated switch. The thumb is a layout-animated motion element so
// it springs between off/on. Fully controlled, accessible (role=switch), and
// reduced-motion safe.
// ─────────────────────────────────────────────────────────────────────────────

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

export interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Visible label rendered to the left of the switch. */
  label?: string;
  /** Smaller secondary line under the label. */
  hint?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
  className,
  id,
}: ToggleProps) {
  const reduce = useReducedMotion();

  const track = (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 cursor-pointer",
        "transition-colors duration-300 outline-none",
        "focus-visible:ring-2 focus-visible:ring-canopy/60 focus-visible:ring-offset-2 focus-visible:ring-offset-base",
        checked
          ? "bg-gradient-to-r from-canopy to-tide"
          : "bg-white/10 border border-white/10",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      <motion.span
        layout
        transition={
          reduce
            ? { duration: 0 }
            : { type: "spring", stiffness: 600, damping: 32 }
        }
        className={cn(
          "block h-5 w-5 rounded-full bg-white shadow-md",
          checked ? "ml-auto" : "ml-0",
        )}
      />
    </button>
  );

  if (!label && !hint) return <span className={className}>{track}</span>;

  return (
    <label
      htmlFor={id}
      className={cn("flex items-center justify-between gap-4", className)}
    >
      <span className="min-w-0">
        {label && <span className="block text-sm font-medium text-ink">{label}</span>}
        {hint && <span className="block text-xs text-faint">{hint}</span>}
      </span>
      {track}
    </label>
  );
}

export default Toggle;
