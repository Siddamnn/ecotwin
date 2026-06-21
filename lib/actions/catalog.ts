// ─────────────────────────────────────────────────────────────────────────────
// Action catalog — the menu of changes a user can make. Each action is a pure
// transform on the Twin plus an effort score and a money estimate. The ranking
// engine (rank.ts) turns these into impact-per-effort recommendations & quests.
// ─────────────────────────────────────────────────────────────────────────────

import type { ActionTemplate, DietType, Twin } from "@/types";
import {
  AC_KW,
  DIET_LADDER,
  EV_INR_PER_KM,
  FLIGHT_SHORT_HAUL_INR,
  PETROL_INR_PER_KM,
  SOLAR_RESIDUAL,
  TARIFF_INR_PER_KWH,
  TRANSIT_INR_PER_KM,
} from "@/lib/emissions/factors";

const WEEKS = 52;
const RIDESHARE_INR_PER_KM = 15;

// ── small pure helpers ───────────────────────────────────────────────────────
function withHome(t: Twin, patch: Partial<Twin["home"]>): Twin {
  return { ...t, home: { ...t.home, ...patch } };
}
function withTransport(t: Twin, patch: Partial<Twin["transport"]>): Twin {
  return { ...t, transport: { ...t.transport, ...patch } };
}
function withDiet(t: Twin, patch: Partial<Twin["diet"]>): Twin {
  return { ...t, diet: { ...t.diet, ...patch } };
}
function withFlights(t: Twin, patch: Partial<Twin["flights"]>): Twin {
  return { ...t, flights: { ...t.flights, ...patch } };
}
function withShopping(t: Twin, patch: Partial<Twin["shopping"]>): Twin {
  return { ...t, shopping: { ...t.shopping, ...patch } };
}

/** The next, more plant-forward diet on the ladder (caps at vegan). */
function improveDiet(type: DietType): DietType {
  const i = DIET_LADDER.indexOf(type);
  return DIET_LADDER[Math.min(i + 1, DIET_LADDER.length - 1)];
}

/** Estimated annual AC electricity (kWh) for this home. */
function acAnnualKwh(t: Twin): number {
  return t.home.acHoursPerDay * 365 * AC_KW;
}

export const ACTION_CATALOG: ActionTemplate[] = [
  {
    id: "ac-setpoint",
    title: "Set AC to 24°C, not 20°C",
    description: "Every degree warmer cuts ~6% of cooling energy. Barely noticeable, big payoff.",
    category: "home",
    effort: 1,
    icon: "ThermometerSun",
    quest: { goal: "Keep the AC at 24°C", target: 7, unit: "days" },
    apply: (t) => {
      const saved = acAnnualKwh(t) * 0.24; // ~4°C × 6%
      return withHome(t, {
        electricityKwhPerMonth: Math.max(0, t.home.electricityKwhPerMonth - saved / 12),
      });
    },
    annualSavingInr: (t) => acAnnualKwh(t) * 0.24 * TARIFF_INR_PER_KWH,
  },
  {
    id: "led-swap",
    title: "Switch every bulb to LED",
    description: "Lighting can be ~8% of your power bill. LEDs use a fraction and last for years.",
    category: "home",
    effort: 1,
    icon: "Lightbulb",
    capitalCostInr: 1500,
    quest: { goal: "Replace your most-used bulbs", target: 5, unit: "bulbs" },
    apply: (t) =>
      withHome(t, {
        electricityKwhPerMonth: t.home.electricityKwhPerMonth * 0.92,
      }),
    annualSavingInr: (t) => t.home.electricityKwhPerMonth * 12 * 0.08 * TARIFF_INR_PER_KWH,
  },
  {
    id: "veg-dinners",
    title: "Eat plant-based 2 dinners a week",
    description: "Shifting toward plants is one of the highest-impact diet changes you can make.",
    category: "diet",
    effort: 2,
    icon: "Salad",
    quest: { goal: "Cook a plant-based dinner", target: 2, unit: "dinners/wk" },
    apply: (t) => withDiet(t, { type: improveDiet(t.diet.type) }),
    annualSavingInr: (t) => (t.diet.type === "vegan" ? 0 : 3000),
  },
  {
    id: "transit-commute",
    title: "Take transit 3 days a week",
    description: "Swap the car for metro/bus on your commute. Cleaner air, cheaper, less traffic.",
    category: "transport",
    effort: 3,
    icon: "TrainFront",
    quest: { goal: "Commute by public transit", target: 3, unit: "days/wk" },
    apply: (t) => {
      const shift = t.transport.carKmPerWeek * 0.4; // ~3 of 7 days
      return withTransport(t, {
        carKmPerWeek: t.transport.carKmPerWeek - shift,
        publicTransitKmPerWeek: t.transport.publicTransitKmPerWeek + shift,
      });
    },
    annualSavingInr: (t) =>
      t.transport.carKmPerWeek * 0.4 * WEEKS * (PETROL_INR_PER_KM - TRANSIT_INR_PER_KM),
  },
  {
    id: "cut-short-flight",
    title: "Cut one short-haul flight a year",
    description: "Take the train or video-call instead. A single flight can outweigh months of effort elsewhere.",
    category: "flights",
    effort: 4,
    icon: "PlaneTakeoff",
    quest: { goal: "Replace a flight with rail/remote", target: 1, unit: "flight" },
    apply: (t) =>
      withFlights(t, { shortHaulPerYear: Math.max(0, t.flights.shortHaulPerYear - 1) }),
    annualSavingInr: () => FLIGHT_SHORT_HAUL_INR,
  },
  {
    id: "ditch-fast-fashion",
    title: "Halve your fast-fashion spend",
    description: "Buy less, buy better, buy second-hand. Textiles carry a surprisingly heavy footprint.",
    category: "shopping",
    effort: 2,
    icon: "Shirt",
    quest: { goal: "Go a week without new clothes", target: 4, unit: "weeks" },
    apply: (t) =>
      withShopping(t, { clothingSpendPerMonth: t.shopping.clothingSpendPerMonth * 0.5 }),
    annualSavingInr: (t) => t.shopping.clothingSpendPerMonth * 12 * 0.5,
  },
  {
    id: "rideshare-to-transit",
    title: "Replace rideshares with transit",
    description: "Cabs run heavy with empty return trips. Transit is a fraction of the cost and carbon.",
    category: "transport",
    effort: 2,
    icon: "Bus",
    quest: { goal: "Choose transit over a cab", target: 5, unit: "trips" },
    apply: (t) => {
      const shift = t.transport.rideshareKmPerWeek * 0.7;
      return withTransport(t, {
        rideshareKmPerWeek: t.transport.rideshareKmPerWeek - shift,
        publicTransitKmPerWeek: t.transport.publicTransitKmPerWeek + shift,
      });
    },
    annualSavingInr: (t) =>
      t.transport.rideshareKmPerWeek * 0.7 * WEEKS * (RIDESHARE_INR_PER_KM - TRANSIT_INR_PER_KM),
  },
  {
    id: "go-ev",
    title: "Switch your car to electric",
    description: "A bigger move — but it slashes both running cost and tailpipe emissions for years.",
    category: "transport",
    effort: 5,
    icon: "BatteryCharging",
    capitalCostInr: 300000,
    quest: { goal: "Test-drive & cost an EV", target: 1, unit: "plan" },
    apply: (t) =>
      t.transport.carType === "none"
        ? t
        : withTransport(t, { carType: "ev" }),
    annualSavingInr: (t) =>
      t.transport.carKmPerWeek * WEEKS * (PETROL_INR_PER_KM - EV_INR_PER_KM),
  },
  {
    id: "rooftop-solar",
    title: "Install rooftop solar",
    description: "Generate your own clean power. High upfront cost, but it pays back and then some.",
    category: "home",
    effort: 5,
    icon: "SunMedium",
    capitalCostInr: 150000,
    quest: { goal: "Get a rooftop solar quote", target: 1, unit: "quote" },
    apply: (t) => (t.home.hasSolar ? t : withHome(t, { hasSolar: true })),
    annualSavingInr: (t) =>
      t.home.electricityKwhPerMonth * 12 * (1 - SOLAR_RESIDUAL) * TARIFF_INR_PER_KWH,
  },
];

export function getAction(id: string): ActionTemplate | undefined {
  return ACTION_CATALOG.find((a) => a.id === id);
}
