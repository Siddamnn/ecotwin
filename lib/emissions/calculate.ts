// ─────────────────────────────────────────────────────────────────────────────
// The carbon engine. Pure functions: Twin → emissions. This is the single source
// of truth for the baseline AND for every simulator/quest projection.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Category,
  EmissionBreakdown,
  HomeProfile,
  Twin,
} from "@/types";
import {
  CAR_KG_PER_KM,
  CLOTHING_KG_PER_INR,
  CONSUMPTION_BASE_KG,
  DIET_ANNUAL_KG,
  EAT_OUT_KG_PER_MEAL,
  ELECTRONICS_KG_EACH,
  FLIGHT_LONG_HAUL_KG,
  FLIGHT_SHORT_HAUL_KG,
  GRID_KG_PER_KWH,
  LPG_CYLINDER_KG,
  LPG_KG_PER_KG,
  MOTORBIKE_KG_PER_KM,
  RIDESHARE_KG_PER_KM,
  SOLAR_RESIDUAL,
  TRANSIT_KG_PER_KM,
} from "./factors";

const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;

/** Personal share of household energy. Home emissions are split per occupant. */
export function homeEmissions(home: HomeProfile): number {
  const solarFactor = home.hasSolar ? SOLAR_RESIDUAL : 1;
  const electricityKg =
    home.electricityKwhPerMonth * MONTHS_PER_YEAR * GRID_KG_PER_KWH * solarFactor;
  const lpgKg =
    home.lpgCylindersPerMonth * MONTHS_PER_YEAR * LPG_CYLINDER_KG * LPG_KG_PER_KG;
  const occupants = Math.max(1, home.occupants);
  return (electricityKg + lpgKg) / occupants;
}

export function transportEmissions(t: Twin["transport"]): number {
  return (
    t.carKmPerWeek * CAR_KG_PER_KM[t.carType] +
    t.bikeKmPerWeek * MOTORBIKE_KG_PER_KM +
    t.publicTransitKmPerWeek * TRANSIT_KG_PER_KM +
    t.rideshareKmPerWeek * RIDESHARE_KG_PER_KM
  ) * WEEKS_PER_YEAR;
}

export function flightEmissions(f: Twin["flights"]): number {
  return (
    f.shortHaulPerYear * FLIGHT_SHORT_HAUL_KG +
    f.longHaulPerYear * FLIGHT_LONG_HAUL_KG
  );
}

export function dietEmissions(d: Twin["diet"]): number {
  const eatingOut = d.eatOutPerWeek * WEEKS_PER_YEAR * EAT_OUT_KG_PER_MEAL;
  return DIET_ANNUAL_KG[d.type] + eatingOut;
}

export function shoppingEmissions(s: Twin["shopping"]): number {
  return (
    s.clothingSpendPerMonth * MONTHS_PER_YEAR * CLOTHING_KG_PER_INR +
    s.electronicsPerYear * ELECTRONICS_KG_EACH +
    CONSUMPTION_BASE_KG[s.consumption]
  );
}

/** Full breakdown: per-category + total, in kg CO₂e / year. */
export function calculate(twin: Twin): EmissionBreakdown {
  const perCategory: Record<Category, number> = {
    home: homeEmissions(twin.home),
    transport: transportEmissions(twin.transport),
    flights: flightEmissions(twin.flights),
    diet: dietEmissions(twin.diet),
    shopping: shoppingEmissions(twin.shopping),
  };
  const total = Object.values(perCategory).reduce((sum, kg) => sum + kg, 0);
  return { perCategory, total };
}

/** Convenience: just the annual total. */
export function totalEmissions(twin: Twin): number {
  return calculate(twin).total;
}
