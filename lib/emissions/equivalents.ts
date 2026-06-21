// ─────────────────────────────────────────────────────────────────────────────
// Tangible equivalents — turn abstract kg CO₂e into things humans can feel.
// Used everywhere a footprint number appears.
// ─────────────────────────────────────────────────────────────────────────────

import {
  EQUIV_CAR_KG_PER_KM,
  INDIA_AVERAGE_KG,
  SMARTPHONE_CHARGE_KG,
  SUSTAINABLE_TARGET_KG,
  TREE_KG_PER_YEAR,
  WORLD_AVERAGE_KG,
} from "./factors";

export interface Equivalent {
  icon: string; // lucide-react icon name
  value: number;
  label: string;
}

/** Mature trees needed for a year to absorb this much CO₂. */
export function treesForYear(kg: number): number {
  return kg / TREE_KG_PER_YEAR;
}

/** Equivalent km driven in an average petrol car. */
export function kmDriven(kg: number): number {
  return kg / EQUIV_CAR_KG_PER_KM;
}

/** Equivalent smartphone charges. */
export function smartphoneCharges(kg: number): number {
  return kg / SMARTPHONE_CHARGE_KG;
}

/** A small set of equivalents ready to render as chips/cards. */
export function equivalents(kg: number): Equivalent[] {
  return [
    {
      icon: "TreePine",
      value: Math.round(treesForYear(kg)),
      label: "trees needed for a year",
    },
    {
      icon: "Car",
      value: Math.round(kmDriven(kg)),
      label: "km driven by car",
    },
    {
      icon: "Smartphone",
      value: Math.round(smartphoneCharges(kg)),
      label: "phone charges",
    },
  ];
}

export interface Benchmark {
  label: string;
  valueKg: number;
  /** Ratio of the user's footprint to this benchmark. */
  ratio: (userKg: number) => number;
}

export const BENCHMARKS = {
  india: INDIA_AVERAGE_KG,
  world: WORLD_AVERAGE_KG,
  target: SUSTAINABLE_TARGET_KG,
} as const;

/** How the user compares to the India average, as a multiple. */
export function vsIndiaAverage(userKg: number): number {
  return userKg / INDIA_AVERAGE_KG;
}
