// ─────────────────────────────────────────────────────────────────────────────
// EcoTwin — shared domain types (single source of truth for every module/agent)
// ─────────────────────────────────────────────────────────────────────────────

// ───────────────────────── Twin (lifestyle model) ──────────────────────────

export type CarType = "none" | "small" | "petrol" | "diesel" | "ev";

export type DietType =
  | "heavy-meat"
  | "omnivore"
  | "low-meat"
  | "pescatarian"
  | "vegetarian"
  | "vegan";

export type ConsumptionLevel = "low" | "average" | "high";

export interface HomeProfile {
  occupants: number;
  /** Total household electricity from the bill (kWh / month). */
  electricityKwhPerMonth: number;
  /** 14.2 kg LPG cylinders consumed per month. */
  lpgCylindersPerMonth: number;
  /** Average air-conditioning runtime (hours / day, annualised). */
  acHoursPerDay: number;
  hasSolar: boolean;
}

export interface TransportProfile {
  carType: CarType;
  carKmPerWeek: number;
  bikeKmPerWeek: number;
  publicTransitKmPerWeek: number;
  rideshareKmPerWeek: number;
}

export interface FlightProfile {
  /** Round trips < ~1500 km per year. */
  shortHaulPerYear: number;
  longHaulPerYear: number;
}

export interface DietProfile {
  type: DietType;
  /** Restaurant / takeaway meals per week. */
  eatOutPerWeek: number;
}

export interface ShoppingProfile {
  /** INR spent on clothing per month. */
  clothingSpendPerMonth: number;
  /** Major electronic devices bought per year. */
  electronicsPerYear: number;
  consumption: ConsumptionLevel;
}

export interface Twin {
  home: HomeProfile;
  transport: TransportProfile;
  flights: FlightProfile;
  diet: DietProfile;
  shopping: ShoppingProfile;
}

// ───────────────────────────── Emissions ───────────────────────────────────

export type Category = "home" | "transport" | "flights" | "diet" | "shopping";

export const CATEGORIES: Category[] = [
  "home",
  "transport",
  "flights",
  "diet",
  "shopping",
];

export interface EmissionBreakdown {
  /** kg CO₂e / year per category. */
  perCategory: Record<Category, number>;
  /** kg CO₂e / year, summed. */
  total: number;
}

// ──────────────────────── Actions & ranking ────────────────────────────────

export type Effort = 1 | 2 | 3 | 4 | 5;

export interface ActionTemplate {
  id: string;
  title: string;
  /** Short, action-oriented description shown on cards. */
  description: string;
  category: Category;
  effort: Effort;
  /** lucide-react icon name. */
  icon: string;
  /** Quest framing: what "completing" the habit looks like + its cadence. */
  quest: { goal: string; target: number; unit: string };
  /** One-time capital outlay in INR (solar, EV…), if any. */
  capitalCostInr?: number;
  /** Pure transform → the twin after adopting this action. */
  apply: (twin: Twin) => Twin;
  /** Money saved per year in INR for this twin (rough estimate). */
  annualSavingInr: (twin: Twin) => number;
}

export interface RankedAction {
  template: ActionTemplate;
  annualSavingKg: number;
  annualSavingInr: number;
  /** Months to recoup capital, when applicable. */
  paybackMonths?: number;
  /** Impact-per-effort = annualSavingKg / effort. The ranking signal. */
  score: number;
}

// ───────────────────────────── Gamification ────────────────────────────────

export type TierId = "seedling" | "sapling" | "sprout" | "tree" | "forest";

export interface Tier {
  id: TierId;
  name: string;
  minPoints: number;
  emoji: string;
  /** Tailwind gradient classes for the tier badge. */
  gradient: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface QuestProgress {
  /** References an ActionTemplate id. */
  questId: string;
  acceptedAt: string; // ISO yyyy-mm-dd
  target: number;
  progress: number;
  status: "active" | "completed";
  completedAt?: string;
}

export interface FootprintPoint {
  date: string; // ISO yyyy-mm-dd
  totalKg: number;
}

/** Read-only snapshot the badge engine evaluates against. */
export interface GameStats {
  greenPoints: number;
  currentStreakDays: number;
  longestStreakDays: number;
  completedQuests: number;
  totalKgSaved: number;
}

export interface GameState {
  greenPoints: number;
  currentStreakDays: number;
  longestStreakDays: number;
  lastCheckIn: string | null; // ISO yyyy-mm-dd
  unlockedBadgeIds: string[];
  activeQuests: QuestProgress[];
  completedQuestIds: string[];
  footprintHistory: FootprintPoint[];
}
