"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Icon — render a lucide-react icon by *string* name. The whole domain stores
// icons as strings (CATEGORY_META.home.icon === "House", equivalents()[].icon …)
// so this indirection is load-bearing across the entire app.
// ─────────────────────────────────────────────────────────────────────────────

import * as Lucide from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;

export interface IconProps extends SVGProps<SVGSVGElement> {
  /** A lucide-react icon name, e.g. "TreePine", "House", "Car". */
  name: string;
  /** Pixel size (sets width & height). Defaults to 24. */
  size?: number;
}

const REGISTRY = Lucide as unknown as Record<string, LucideIcon | undefined>;

/** Sensible fallback so an unknown/typo'd icon name never crashes a render. */
const FALLBACK: LucideIcon = (Lucide.Sparkles ?? Lucide.Circle) as LucideIcon;

export function Icon({ name, size = 24, ...rest }: IconProps) {
  const Cmp = REGISTRY[name] ?? FALLBACK;
  return <Cmp width={size} height={size} {...rest} />;
}

export default Icon;
