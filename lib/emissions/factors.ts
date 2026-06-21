// ─────────────────────────────────────────────────────────────────────────────
// Emission factors. India-relevant where possible. Each value is annotated with
// its source. These are intentionally transparent constants — the whole carbon
// model is auditable from this one file.
// ─────────────────────────────────────────────────────────────────────────────

import type { CarType, ConsumptionLevel, DietType } from "@/types";

// ── Home energy ──────────────────────────────────────────────────────────────
/** India national grid emission factor. Source: CEA CO₂ Baseline Database. */
export const GRID_KG_PER_KWH = 0.71;
/** LPG combustion. Source: DEFRA/BEIS GHG conversion factors. */
export const LPG_KG_PER_KG = 2.98;
/** Standard Indian domestic LPG cylinder. */
export const LPG_CYLINDER_KG = 14.2;
/** Fraction of grid electricity still drawn after a rooftop solar install. */
export const SOLAR_RESIDUAL = 0.3;
/** Typical residential AC power draw (kW). */
export const AC_KW = 1.5;
/** Residential electricity tariff (INR/kWh), used for money savings. */
export const TARIFF_INR_PER_KWH = 8;

// ── Transport (kg CO₂e per km) ───────────────────────────────────────────────
// Source: DEFRA/BEIS passenger-vehicle & public-transport factors (per pax-km).
export const CAR_KG_PER_KM: Record<CarType, number> = {
  none: 0,
  small: 0.12,
  petrol: 0.17,
  diesel: 0.17,
  ev: 0.05, // grid-charged, using the India grid factor
};
export const MOTORBIKE_KG_PER_KM = 0.07;
export const TRANSIT_KG_PER_KM = 0.02; // bus/metro average per passenger-km
export const RIDESHARE_KG_PER_KM = 0.2; // car + deadheading overhead

export const PETROL_INR_PER_KM = 7;
export const EV_INR_PER_KM = 1.5;
export const TRANSIT_INR_PER_KM = 2;

// ── Flights (kg CO₂e per round trip, incl. radiative forcing) ────────────────
// Derived from ICAO-style ~0.15–0.18 kg/pax-km over representative distances.
export const FLIGHT_SHORT_HAUL_KG = 500; // e.g. Delhi–Mumbai return
export const FLIGHT_LONG_HAUL_KG = 2500; // e.g. Delhi–London return
export const FLIGHT_SHORT_HAUL_INR = 6000;
export const FLIGHT_LONG_HAUL_INR = 45000;

// ── Diet (kg CO₂e per year) ──────────────────────────────────────────────────
// Source: Poore & Nemecek (Science, 2018), scaled to annual diets.
export const DIET_ANNUAL_KG: Record<DietType, number> = {
  "heavy-meat": 3300,
  omnivore: 2500,
  "low-meat": 1900,
  pescatarian: 1700,
  vegetarian: 1700,
  vegan: 1500,
};
/** Diets ordered worst → best (used to model "eat more plants" actions). */
export const DIET_LADDER: DietType[] = [
  "heavy-meat",
  "omnivore",
  "low-meat",
  "pescatarian",
  "vegetarian",
  "vegan",
];
/** Extra footprint per restaurant meal (transport, waste, portion size). */
export const EAT_OUT_KG_PER_MEAL = 3;

// ── Shopping & consumption ───────────────────────────────────────────────────
/** Spend-based factor for clothing/textiles (kg CO₂e per INR). */
export const CLOTHING_KG_PER_INR = 0.015;
/** Embodied emissions of an average new electronic device. */
export const ELECTRONICS_KG_EACH = 100;
/** Baseline "everything else" goods & services, by self-reported intensity. */
export const CONSUMPTION_BASE_KG: Record<ConsumptionLevel, number> = {
  low: 200,
  average: 500,
  high: 1000,
};

// ── Reference points for comparison ──────────────────────────────────────────
/** Indian per-capita footprint (approx., consumption-based). */
export const INDIA_AVERAGE_KG = 1900;
/** Global per-capita footprint (approx.). */
export const WORLD_AVERAGE_KG = 4700;
/** Per-capita target compatible with 1.5°C by ~2030. */
export const SUSTAINABLE_TARGET_KG = 2000;

// ── Tangible equivalents ─────────────────────────────────────────────────────
/** CO₂ absorbed by one mature tree per year (kg). */
export const TREE_KG_PER_YEAR = 21;
/** CO₂ per km in an average petrol car (for the "= km driven" equivalent). */
export const EQUIV_CAR_KG_PER_KM = 0.17;
/** CO₂ per smartphone charge (kg). */
export const SMARTPHONE_CHARGE_KG = 0.008;
