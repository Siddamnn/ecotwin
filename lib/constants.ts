// ─────────────────────────────────────────────────────────────────────────────
// App-wide presets: a sensible default twin + option metadata for the onboarding
// wizard. Centralised so the wizard, simulator and store all share one vocabulary.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  CarType,
  Category,
  ConsumptionLevel,
  DietType,
  Twin,
} from "@/types";

/** A typical urban-Indian starting point (pre-filled, fully editable). */
export const DEFAULT_TWIN: Twin = {
  home: {
    occupants: 3,
    electricityKwhPerMonth: 250,
    lpgCylindersPerMonth: 1,
    acHoursPerDay: 4,
    hasSolar: false,
  },
  transport: {
    carType: "petrol",
    carKmPerWeek: 150,
    bikeKmPerWeek: 20,
    publicTransitKmPerWeek: 30,
    rideshareKmPerWeek: 20,
  },
  flights: { shortHaulPerYear: 2, longHaulPerYear: 0 },
  diet: { type: "omnivore", eatOutPerWeek: 3 },
  shopping: { clothingSpendPerMonth: 2000, electronicsPerYear: 1, consumption: "average" },
};

export interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
  emoji?: string;
}

export const DIET_OPTIONS: Option<DietType>[] = [
  { value: "heavy-meat", label: "Meat lover", hint: "Meat at most meals", emoji: "🥩" },
  { value: "omnivore", label: "Omnivore", hint: "Meat a few times a week", emoji: "🍗" },
  { value: "low-meat", label: "Flexitarian", hint: "Mostly plants, some meat", emoji: "🥙" },
  { value: "pescatarian", label: "Pescatarian", hint: "Fish, no meat", emoji: "🐟" },
  { value: "vegetarian", label: "Vegetarian", hint: "No meat or fish", emoji: "🥗" },
  { value: "vegan", label: "Vegan", hint: "Fully plant-based", emoji: "🌱" },
];

export const CAR_OPTIONS: Option<CarType>[] = [
  { value: "none", label: "No car", emoji: "🚶" },
  { value: "small", label: "Small / hatchback", emoji: "🚙" },
  { value: "petrol", label: "Petrol", emoji: "⛽" },
  { value: "diesel", label: "Diesel", emoji: "🛢️" },
  { value: "ev", label: "Electric", emoji: "🔋" },
];

export const CONSUMPTION_OPTIONS: Option<ConsumptionLevel>[] = [
  { value: "low", label: "Minimalist", hint: "I rarely buy new things", emoji: "🌿" },
  { value: "average", label: "Average", hint: "A typical shopper", emoji: "🛍️" },
  { value: "high", label: "Frequent", hint: "I love new gadgets & gear", emoji: "📦" },
];

/** Display metadata for each emission category (labels, colors, icons). */
export const CATEGORY_META: Record<
  Category,
  { label: string; icon: string; color: string }
> = {
  home: { label: "Home & Energy", icon: "House", color: "#34d399" },
  transport: { label: "Transport", icon: "Car", color: "#2dd4bf" },
  flights: { label: "Flights", icon: "Plane", color: "#38bdf8" },
  diet: { label: "Food & Diet", icon: "Utensils", color: "#a3e635" },
  shopping: { label: "Shopping", icon: "ShoppingBag", color: "#fbbf24" },
};
