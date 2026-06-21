"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Button — the one button to rule them all. Spring tap/hover via framer-motion,
// four variants, three sizes. Primary is the emerald→teal gradient with a canopy
// glow on hover. Reduced-motion safe (motion collapses to a static button).
// ─────────────────────────────────────────────────────────────────────────────

import { forwardRef } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "text-[#04130c] font-semibold bg-gradient-to-br from-canopy via-canopy-soft to-tide " +
    "shadow-[0_8px_30px_-8px_rgba(52,211,153,0.55)] hover:glow-canopy",
  secondary:
    "glass-strong text-ink hover:border-canopy/40 hover:bg-elevated/80",
  ghost:
    "text-muted hover:text-ink hover:bg-white/5",
  outline:
    "border border-canopy/40 text-canopy-soft hover:bg-canopy/10 hover:border-canopy/70",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm rounded-xl gap-1.5",
  md: "h-11 px-6 text-[0.95rem] rounded-xl gap-2",
  lg: "h-14 px-8 text-base rounded-2xl gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, children, disabled, ...rest },
  ref,
) {
  const reduce = useReducedMotion();

  return (
    <motion.button
      ref={ref}
      disabled={disabled}
      whileHover={reduce || disabled ? undefined : { scale: 1.03, y: -1 }}
      whileTap={reduce || disabled ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      className={cn(
        "relative inline-flex items-center justify-center select-none whitespace-nowrap",
        "transition-colors duration-200 outline-none cursor-pointer",
        "focus-visible:ring-2 focus-visible:ring-canopy/60 focus-visible:ring-offset-2 focus-visible:ring-offset-base",
        "disabled:opacity-50 disabled:pointer-events-none",
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
});

export default Button;
