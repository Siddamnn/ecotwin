"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Wizard step content. Each step edits one slice of the Twin via a `patch`
// callback. All inputs are seeded from DEFAULT_TWIN by the parent wizard and are
// fully editable. Pure presentation — no store access here.
// ─────────────────────────────────────────────────────────────────────────────

import type { Twin } from "@/types";
import {
  CAR_OPTIONS,
  CONSUMPTION_OPTIONS,
  DIET_OPTIONS,
} from "@/lib/constants";
import { formatInr } from "@/lib/utils";
import { Slider } from "@/components/ui/Slider";
import { Toggle } from "@/components/ui/Toggle";
import { OptionCard } from "./OptionCard";

type Patch = (twin: Partial<Twin>) => void;

export interface StepProps {
  twin: Twin;
  patch: Patch;
}

export interface StepDef {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  Component: (props: StepProps) => React.ReactElement;
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl glass p-4 sm:p-5">{children}</div>;
}

// ── 1. Home & Energy ─────────────────────────────────────────────────────────
function HomeStep({ twin, patch }: StepProps) {
  const h = twin.home;
  const set = (p: Partial<Twin["home"]>) => patch({ home: { ...h, ...p } });
  return (
    <div className="space-y-3">
      <Field>
        <Slider
          label="People in your home"
          value={h.occupants}
          min={1}
          max={8}
          onChange={(v) => set({ occupants: v })}
          format={(v) => `${v} ${v === 1 ? "person" : "people"}`}
        />
      </Field>
      <Field>
        <Slider
          label="Monthly electricity"
          value={h.electricityKwhPerMonth}
          min={0}
          max={1200}
          step={10}
          unit="kWh"
          onChange={(v) => set({ electricityKwhPerMonth: v })}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <Slider
            label="LPG cylinders / month"
            value={h.lpgCylindersPerMonth}
            min={0}
            max={4}
            step={0.5}
            onChange={(v) => set({ lpgCylindersPerMonth: v })}
            format={(v) => `${v}`}
          />
        </Field>
        <Field>
          <Slider
            label="AC use"
            value={h.acHoursPerDay}
            min={0}
            max={16}
            onChange={(v) => set({ acHoursPerDay: v })}
            unit="hrs/day"
          />
        </Field>
      </div>
      <Field>
        <Toggle
          label="Rooftop solar"
          hint="Cuts grid electricity emissions sharply"
          checked={h.hasSolar}
          onChange={(v) => set({ hasSolar: v })}
        />
      </Field>
    </div>
  );
}

// ── 2. Transport ─────────────────────────────────────────────────────────────
function TransportStep({ twin, patch }: StepProps) {
  const t = twin.transport;
  const set = (p: Partial<Twin["transport"]>) =>
    patch({ transport: { ...t, ...p } });
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2.5 text-sm font-medium text-muted">What do you drive?</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {CAR_OPTIONS.map((o) => (
            <OptionCard
              key={o.value}
              value={o.value}
              selected={t.carType === o.value}
              onSelect={(v) => set({ carType: v })}
              emoji={o.emoji}
              label={o.label}
            />
          ))}
        </div>
      </div>
      {t.carType !== "none" && (
        <Field>
          <Slider
            label="Car distance"
            value={t.carKmPerWeek}
            min={0}
            max={1000}
            step={10}
            unit="km/wk"
            onChange={(v) => set({ carKmPerWeek: v })}
          />
        </Field>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field>
          <Slider
            label="Two-wheeler"
            value={t.bikeKmPerWeek}
            min={0}
            max={500}
            step={5}
            unit="km/wk"
            onChange={(v) => set({ bikeKmPerWeek: v })}
          />
        </Field>
        <Field>
          <Slider
            label="Bus / metro"
            value={t.publicTransitKmPerWeek}
            min={0}
            max={500}
            step={5}
            unit="km/wk"
            onChange={(v) => set({ publicTransitKmPerWeek: v })}
          />
        </Field>
        <Field>
          <Slider
            label="Cabs / rideshare"
            value={t.rideshareKmPerWeek}
            min={0}
            max={300}
            step={5}
            unit="km/wk"
            onChange={(v) => set({ rideshareKmPerWeek: v })}
          />
        </Field>
      </div>
    </div>
  );
}

// ── 3. Flights ───────────────────────────────────────────────────────────────
function FlightsStep({ twin, patch }: StepProps) {
  const f = twin.flights;
  const set = (p: Partial<Twin["flights"]>) => patch({ flights: { ...f, ...p } });
  return (
    <div className="space-y-3">
      <Field>
        <Slider
          label="Short-haul round trips / year"
          value={f.shortHaulPerYear}
          min={0}
          max={20}
          onChange={(v) => set({ shortHaulPerYear: v })}
          format={(v) => `${v}`}
        />
        <p className="mt-2 text-xs text-faint">e.g. Delhi ↔ Mumbai. Flights punch well above their weight.</p>
      </Field>
      <Field>
        <Slider
          label="Long-haul round trips / year"
          value={f.longHaulPerYear}
          min={0}
          max={12}
          onChange={(v) => set({ longHaulPerYear: v })}
          format={(v) => `${v}`}
        />
        <p className="mt-2 text-xs text-faint">e.g. Delhi ↔ London. One of these can outweigh a year of driving.</p>
      </Field>
    </div>
  );
}

// ── 4. Diet ──────────────────────────────────────────────────────────────────
function DietStep({ twin, patch }: StepProps) {
  const d = twin.diet;
  const set = (p: Partial<Twin["diet"]>) => patch({ diet: { ...d, ...p } });
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2.5 text-sm font-medium text-muted">How do you eat?</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {DIET_OPTIONS.map((o) => (
            <OptionCard
              key={o.value}
              value={o.value}
              selected={d.type === o.value}
              onSelect={(v) => set({ type: v })}
              emoji={o.emoji}
              label={o.label}
              hint={o.hint}
            />
          ))}
        </div>
      </div>
      <Field>
        <Slider
          label="Eating out / takeaway per week"
          value={d.eatOutPerWeek}
          min={0}
          max={21}
          onChange={(v) => set({ eatOutPerWeek: v })}
          format={(v) => `${v} meals`}
        />
      </Field>
    </div>
  );
}

// ── 5. Shopping ──────────────────────────────────────────────────────────────
function ShoppingStep({ twin, patch }: StepProps) {
  const s = twin.shopping;
  const set = (p: Partial<Twin["shopping"]>) =>
    patch({ shopping: { ...s, ...p } });
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2.5 text-sm font-medium text-muted">How often do you buy new things?</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CONSUMPTION_OPTIONS.map((o) => (
            <OptionCard
              key={o.value}
              value={o.value}
              selected={s.consumption === o.value}
              onSelect={(v) => set({ consumption: v })}
              emoji={o.emoji}
              label={o.label}
              hint={o.hint}
            />
          ))}
        </div>
      </div>
      <Field>
        <Slider
          label="Clothing spend / month"
          value={s.clothingSpendPerMonth}
          min={0}
          max={20000}
          step={500}
          onChange={(v) => set({ clothingSpendPerMonth: v })}
          format={(v) => formatInr(v)}
        />
      </Field>
      <Field>
        <Slider
          label="New gadgets / year"
          value={s.electronicsPerYear}
          min={0}
          max={10}
          onChange={(v) => set({ electronicsPerYear: v })}
          format={(v) => `${v}`}
        />
      </Field>
    </div>
  );
}

export const STEPS: StepDef[] = [
  {
    id: "home",
    title: "Home & Energy",
    subtitle: "Where it all starts — your household's footprint, split per person.",
    icon: "House",
    Component: HomeStep,
  },
  {
    id: "transport",
    title: "Transport",
    subtitle: "How you get around, week to week.",
    icon: "Car",
    Component: TransportStep,
  },
  {
    id: "flights",
    title: "Flights",
    subtitle: "The big-ticket items. Even a few trips add up fast.",
    icon: "Plane",
    Component: FlightsStep,
  },
  {
    id: "diet",
    title: "Food & Diet",
    subtitle: "What's on your plate matters more than you'd think.",
    icon: "Utensils",
    Component: DietStep,
  },
  {
    id: "shopping",
    title: "Shopping",
    subtitle: "Everything else you buy and use.",
    icon: "ShoppingBag",
    Component: ShoppingStep,
  },
];
