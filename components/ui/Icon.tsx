"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Icon — render a lucide-react icon by *string* name. The whole domain stores
// icons as strings (CATEGORY_META.home.icon === "House", equivalents()[].icon …)
// so this indirection is load-bearing across the entire app.
//
// PERF: we import only the icons the app actually uses (explicit named imports →
// tree-shaken) and key them in a static registry. A namespace import
// (`import * as Lucide`) would pull lucide-react's ENTIRE icon set (~200 KB gz)
// into every page's First Load JS; this keeps it to just what's referenced. When
// adding a new icon name anywhere in the app, add it to REGISTRY below.
// ─────────────────────────────────────────────────────────────────────────────

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Award,
  BatteryCharging,
  Bus,
  CalendarCheck,
  Car,
  ChartPie,
  Check,
  CheckCheck,
  Circle,
  Compass,
  Flame,
  FlaskConical,
  Hourglass,
  House,
  LayoutDashboard,
  Leaf,
  Lightbulb,
  ListChecks,
  ListOrdered,
  Lock,
  Minus,
  PartyPopper,
  Pencil,
  Plane,
  PlaneTakeoff,
  Plus,
  Repeat,
  Salad,
  Save,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  SunMedium,
  Target,
  ThermometerSun,
  TrainFront,
  TreePine,
  TrendingDown,
  TrendingUp,
  Trophy,
  Utensils,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;

export interface IconProps extends SVGProps<SVGSVGElement> {
  /** A lucide-react icon name, e.g. "TreePine", "House", "Car". */
  name: string;
  /** Pixel size (sets width & height). Defaults to 24. */
  size?: number;
}

// Only the icons referenced anywhere in the app (string names across
// lib/constants, action catalog, badges, equivalents, onboarding steps and
// every component). Keyed by the exact PascalCase lucide name used as data.
const REGISTRY: Record<string, LucideIcon> = {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Award,
  BatteryCharging,
  Bus,
  CalendarCheck,
  Car,
  ChartPie,
  Check,
  CheckCheck,
  Circle,
  Compass,
  Flame,
  FlaskConical,
  Hourglass,
  House,
  LayoutDashboard,
  Leaf,
  Lightbulb,
  ListChecks,
  ListOrdered,
  Lock,
  Minus,
  PartyPopper,
  Pencil,
  Plane,
  PlaneTakeoff,
  Plus,
  Repeat,
  Salad,
  Save,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  SunMedium,
  Target,
  ThermometerSun,
  TrainFront,
  TreePine,
  TrendingDown,
  TrendingUp,
  Trophy,
  Utensils,
  Wallet,
  X,
  Zap,
};

/** Sensible fallback so an unknown/typo'd icon name never crashes a render. */
const FALLBACK: LucideIcon = Sparkles;

export function Icon({ name, size = 24, ...rest }: IconProps) {
  const Cmp = REGISTRY[name] ?? FALLBACK;
  return <Cmp width={size} height={size} {...rest} />;
}

export default Icon;
