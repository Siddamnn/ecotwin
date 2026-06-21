"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Simulator — the what-if sandbox. A local `draft` twin (seeded from the store)
// is recomputed live on every lever move; the signature Living Tree flourishes
// as the footprint falls toward target, a big CountUp + signed delta lead the
// readout, and a before→after bar makes the shrink visceral. A sticky bar applies
// the draft to the real twin (with a toast + confetti) or resets it.
// Gated on hydration; redirects to /onboarding when not onboarded.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import type { CarType, DietType, Twin } from "@/types";
import { calculate } from "@/lib/emissions/calculate";
import { CAR_OPTIONS, DIET_OPTIONS } from "@/lib/constants";
import {
  EV_INR_PER_KM,
  PETROL_INR_PER_KM,
  SOLAR_RESIDUAL,
  TARIFF_INR_PER_KWH,
} from "@/lib/emissions/factors";
import { useAppStore, useHydrated } from "@/lib/store/useAppStore";
import { clamp, cn, formatCo2, formatInr } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { CountUp } from "@/components/ui/CountUp";
import { Slider } from "@/components/ui/Slider";
import { Toggle } from "@/components/ui/Toggle";
import { Icon } from "@/components/ui/Icon";
import { LivingTree } from "@/components/dashboard/LivingTree";
import { LeverSection, OptionChips } from "@/components/simulator/LeverControls";
import { ComparisonBar } from "@/components/simulator/ComparisonBar";
import { useCelebrate } from "@/components/game/useCelebrate";
import { useRewardToasts } from "@/components/game/RewardToast";

/** Rough ₹/yr saved estimate from the energy + fuel deltas (kept simple). */
function estimateAnnualInrSaved(saved: Twin, draft: Twin): number {
  // electricity: kWh/month delta, adjusted for each twin's solar state
  const kwh = (t: Twin) =>
    t.home.electricityKwhPerMonth * 12 * (t.home.hasSolar ? SOLAR_RESIDUAL : 1);
  const elecInr = (kwh(saved) - kwh(draft)) * TARIFF_INR_PER_KWH;

  // car fuel: km/yr × per-km cost (petrol/diesel/small ≈ petrol, ev cheaper)
  const perKm = (type: CarType) =>
    type === "ev" ? EV_INR_PER_KM : type === "none" ? 0 : PETROL_INR_PER_KM;
  const fuelInr =
    saved.transport.carKmPerWeek * 52 * perKm(saved.transport.carType) -
    draft.transport.carKmPerWeek * 52 * perKm(draft.transport.carType);

  return Math.round(elecInr + fuelInr);
}

function SimulatorSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <div className="skeleton h-72 rounded-3xl" />
        <div className="skeleton h-72 rounded-3xl" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="skeleton h-64 rounded-3xl" />
        <div className="skeleton h-64 rounded-3xl" />
      </div>
    </div>
  );
}

export default function SimulatorPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const onboarded = useAppStore((s) => s.onboarded);
  const twin = useAppStore((s) => s.twin);
  const baselineKg = useAppStore((s) => s.baselineKg);
  const targetKg = useAppStore((s) => s.targetKg);
  const updateTwin = useAppStore((s) => s.updateTwin);

  const celebrate = useCelebrate();
  const { push, viewport } = useRewardToasts();

  const [draft, setDraft] = useState<Twin>(twin);
  // When the underlying twin changes (after Apply, or a quest completion on
  // another screen) re-seed the draft. Done *during render* — React's recommended
  // "adjust state on prop change" pattern — so there's no stale-draft flash and no
  // setState-in-effect cascade.
  const [seededFrom, setSeededFrom] = useState(twin);
  if (seededFrom !== twin) {
    setSeededFrom(twin);
    setDraft(twin);
  }

  useEffect(() => {
    if (hydrated && !onboarded) router.replace("/onboarding");
  }, [hydrated, onboarded, router]);

  const savedTotal = useMemo(() => calculate(twin).total, [twin]);
  const draftTotal = useMemo(() => calculate(draft).total, [draft]);
  const delta = draftTotal - savedTotal;
  const dirty = Math.abs(delta) > 0.5 || JSON.stringify(draft) !== JSON.stringify(twin);

  // tree progress: how far the draft has fallen from baseline toward target
  const baseline = baselineKg || savedTotal;
  const treeProgress = useMemo(() => {
    const span = Math.max(1, baseline - targetKg);
    return clamp((baseline - draftTotal) / span, 0.06, 1);
  }, [baseline, draftTotal, targetKg]);

  const inrSaved = useMemo(() => estimateAnnualInrSaved(twin, draft), [twin, draft]);

  // typed patch helpers (keep the draft immutable)
  const setHome = (patch: Partial<Twin["home"]>) =>
    setDraft((d) => ({ ...d, home: { ...d.home, ...patch } }));
  const setTransport = (patch: Partial<Twin["transport"]>) =>
    setDraft((d) => ({ ...d, transport: { ...d.transport, ...patch } }));
  const setFlights = (patch: Partial<Twin["flights"]>) =>
    setDraft((d) => ({ ...d, flights: { ...d.flights, ...patch } }));
  const setDiet = (patch: Partial<Twin["diet"]>) =>
    setDraft((d) => ({ ...d, diet: { ...d.diet, ...patch } }));
  const setShopping = (patch: Partial<Twin["shopping"]>) =>
    setDraft((d) => ({ ...d, shopping: { ...d.shopping, ...patch } }));

  function handleApply(origin?: { x: number; y: number }) {
    updateTwin(draft);
    celebrate("questComplete", origin);
    push({
      icon: "Check",
      tone: "success",
      message:
        delta < -0.5
          ? `Applied — ${formatCo2(Math.abs(delta))}/yr lighter`
          : "Applied to your twin",
    });
  }

  if (!hydrated || !onboarded) {
    return (
      <div className="py-2">
        <SimulatorSkeleton />
      </div>
    );
  }

  const lower = delta < -0.5;

  return (
    <div className="space-y-5 pb-28 md:pb-24">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">What-if simulator</h1>
          <p className="mt-1 text-sm text-muted">
            Drag the levers — watch your twin react in real time.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs text-faint">
          <Icon name="FlaskConical" size={14} className="text-canopy" />
          Sandbox — nothing saves until you apply
        </span>
      </header>

      {/* ── live readout: tree + numbers ───────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <GlassCard strong glow className="flex flex-col items-center overflow-hidden">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-faint">
            Your living twin
          </p>
          <div className="flex flex-1 items-center justify-center py-1">
            <div className="w-full max-w-[230px]">
              <LivingTree progress={treeProgress} />
            </div>
          </div>
          <p className="text-center text-xs text-muted">
            {treeProgress >= 0.99
              ? "Flourishing — this hits your target."
              : treeProgress > 0.45
                ? "Greener. Keep pulling levers down."
                : "Drag a lever down to grow it."}
          </p>
        </GlassCard>

        <GlassCard className="flex flex-col justify-between gap-5">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-faint">
              Simulated footprint
            </p>
            <div className="mt-1 flex items-end gap-3">
              <p className="font-mono text-4xl font-bold tabular-nums text-ink sm:text-5xl">
                <CountUp value={draftTotal} format={(n) => formatCo2(n)} />
              </p>
              <motion.span
                key={lower ? "down" : delta > 0.5 ? "up" : "flat"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "mb-1.5 inline-flex items-center gap-1 text-sm font-semibold",
                  lower ? "text-canopy-soft" : delta > 0.5 ? "text-warn" : "text-faint",
                )}
              >
                <Icon
                  name={lower ? "ArrowDown" : delta > 0.5 ? "ArrowUp" : "Minus"}
                  size={15}
                />
                {Math.abs(delta) > 0.5 ? `${formatCo2(Math.abs(delta))}/yr` : "no change"}
              </motion.span>
            </div>
          </div>

          <ComparisonBar baseTotal={savedTotal} draftTotal={draftTotal} />

          {inrSaved > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-canopy/[0.07] px-3 py-2.5 text-sm">
              <Icon name="Wallet" size={16} className="text-leaf" />
              <span className="text-muted">Rough money saved</span>
              <span className="ml-auto font-mono font-semibold text-leaf">
                ~{formatInr(inrSaved)}/yr
              </span>
            </div>
          )}
        </GlassCard>
      </div>

      {/* ── lever grid ─────────────────────────────────────────────────────── */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* TRANSPORT */}
        <LeverSection category="transport">
          <OptionChips<CarType>
            label="Car type"
            value={draft.transport.carType}
            options={CAR_OPTIONS}
            onChange={(carType) => setTransport({ carType })}
            layoutId="sim-car"
          />
          <Slider
            label="Car distance"
            value={draft.transport.carKmPerWeek}
            min={0}
            max={500}
            step={5}
            unit="km/wk"
            onChange={(carKmPerWeek) => setTransport({ carKmPerWeek })}
          />
          <Slider
            label="Public transit"
            value={draft.transport.publicTransitKmPerWeek}
            min={0}
            max={300}
            step={5}
            unit="km/wk"
            onChange={(publicTransitKmPerWeek) =>
              setTransport({ publicTransitKmPerWeek })
            }
          />
        </LeverSection>

        {/* HOME */}
        <LeverSection category="home">
          <Slider
            label="Electricity"
            value={draft.home.electricityKwhPerMonth}
            min={0}
            max={1000}
            step={10}
            unit="kWh/mo"
            onChange={(electricityKwhPerMonth) =>
              setHome({ electricityKwhPerMonth })
            }
          />
          <Slider
            label="AC runtime"
            value={draft.home.acHoursPerDay}
            min={0}
            max={16}
            step={0.5}
            format={(v) => `${v} hrs/day`}
            onChange={(acHoursPerDay) => setHome({ acHoursPerDay })}
          />
          <Toggle
            label="Rooftop solar"
            hint="Generate your own clean power"
            checked={draft.home.hasSolar}
            onChange={(hasSolar) => setHome({ hasSolar })}
          />
        </LeverSection>

        {/* DIET */}
        <LeverSection category="diet">
          <OptionChips<DietType>
            label="Diet"
            value={draft.diet.type}
            options={DIET_OPTIONS}
            onChange={(type) => setDiet({ type })}
            layoutId="sim-diet"
          />
          <Slider
            label="Eating out"
            value={draft.diet.eatOutPerWeek}
            min={0}
            max={21}
            step={1}
            format={(v) => `${v} meals/wk`}
            onChange={(eatOutPerWeek) => setDiet({ eatOutPerWeek })}
          />
        </LeverSection>

        {/* FLIGHTS + SHOPPING */}
        <LeverSection category="flights">
          <Slider
            label="Short-haul flights"
            value={draft.flights.shortHaulPerYear}
            min={0}
            max={12}
            step={1}
            format={(v) => `${v} /yr`}
            onChange={(shortHaulPerYear) => setFlights({ shortHaulPerYear })}
          />
          <Slider
            label="Long-haul flights"
            value={draft.flights.longHaulPerYear}
            min={0}
            max={8}
            step={1}
            format={(v) => `${v} /yr`}
            onChange={(longHaulPerYear) => setFlights({ longHaulPerYear })}
          />
          <Slider
            label="Clothing spend"
            value={draft.shopping.clothingSpendPerMonth}
            min={0}
            max={15000}
            step={250}
            format={(v) => `${formatInr(v)}/mo`}
            onChange={(clothingSpendPerMonth) =>
              setShopping({ clothingSpendPerMonth })
            }
          />
        </LeverSection>
      </div>

      {/* ── sticky action bar ──────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[90] flex justify-center px-4 md:bottom-6">
        <motion.div
          initial={false}
          animate={{ y: dirty ? 0 : 12, opacity: dirty ? 1 : 0.85 }}
          className="glass-strong pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl px-4 py-3 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)]"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-faint">
              {dirty ? "Unsaved changes" : "No changes yet"}
            </p>
            <p
              className={cn(
                "truncate font-mono text-sm font-semibold",
                lower ? "text-canopy-soft" : delta > 0.5 ? "text-warn" : "text-muted",
              )}
            >
              {Math.abs(delta) > 0.5
                ? `${delta < 0 ? "−" : "+"}${formatCo2(Math.abs(delta))}/yr`
                : formatCo2(draftTotal)}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            disabled={!dirty}
            onClick={() => setDraft(twin)}
          >
            Reset
          </Button>
          <Button
            size="sm"
            disabled={!dirty}
            onClick={(e) => handleApply({ x: e.clientX, y: e.clientY })}
          >
            <Icon name="Save" size={16} />
            Apply to my twin
          </Button>
        </motion.div>
      </div>

      {viewport}
    </div>
  );
}
