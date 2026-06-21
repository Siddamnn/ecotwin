"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding wizard. Full-screen, 5 steps, seeded from DEFAULT_TWIN and fully
// editable. AnimatePresence slides between steps; a live running estimate (via
// calculate) updates as you go. Finishing calls completeOnboarding(twin) and
// routes to /dashboard. Redirects out if already onboarded.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import type { Twin } from "@/types";
import { DEFAULT_TWIN } from "@/lib/constants";
import { calculate } from "@/lib/emissions/calculate";
import { vsIndiaAverage } from "@/lib/emissions/equivalents";
import { useAppStore, useHydrated } from "@/lib/store/useAppStore";
import { cn, formatCo2 } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { CountUp } from "@/components/ui/CountUp";
import { STEPS } from "@/components/onboarding/steps";

export default function OnboardingPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const onboarded = useAppStore((s) => s.onboarded);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const reduce = useReducedMotion();

  const [twin, setTwin] = useState<Twin>(DEFAULT_TWIN);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  // already onboarded → straight to the dashboard
  useEffect(() => {
    if (hydrated && onboarded) router.replace("/dashboard");
  }, [hydrated, onboarded, router]);

  const patch = (slice: Partial<Twin>) => setTwin((prev) => ({ ...prev, ...slice }));

  const estimate = useMemo(() => calculate(twin).total, [twin]);
  const ratio = vsIndiaAverage(estimate);

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Step = current.Component;

  const go = (delta: number) => {
    setDir(delta);
    setStep((s) => Math.min(STEPS.length - 1, Math.max(0, s + delta)));
  };

  const finish = () => {
    completeOnboarding(twin);
    router.push("/dashboard");
  };

  if (!hydrated) {
    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <div className="skeleton h-72 w-full max-w-2xl rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 py-6 sm:py-10">
      {/* progress dots */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setDir(i > step ? 1 : -1);
              setStep(i);
            }}
            aria-label={`Go to ${s.title}`}
            className="group flex-1"
          >
            <span
              className={cn(
                "block h-1.5 rounded-full transition-all duration-500",
                i <= step ? "bg-gradient-to-r from-canopy to-tide" : "bg-white/10",
              )}
            />
          </button>
        ))}
      </div>

      {/* header */}
      <div className="mb-6 flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-canopy/20 to-tide/10 text-canopy-soft">
          <Icon name={current.icon} size={24} />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-faint">
            Step {step + 1} of {STEPS.length}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {current.title}
          </h1>
          <p className="mt-1 text-sm text-muted">{current.subtitle}</p>
        </div>
      </div>

      {/* animated step body */}
      <div className="relative flex-1">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={current.id}
            custom={dir}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <Step twin={twin} patch={patch} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* live estimate */}
      <div className="sticky bottom-4 mt-8">
        <div className="glass-strong flex items-center justify-between gap-4 rounded-2xl px-5 py-3.5">
          <div className="min-w-0">
            <p className="text-[0.7rem] font-medium uppercase tracking-wider text-faint">
              Running estimate
            </p>
            <p className="flex items-baseline gap-1.5 font-mono text-xl font-semibold tabular-nums text-ink">
              <CountUp value={estimate / 1000} format={(v) => v.toFixed(2)} />
              <span className="text-sm text-muted">t CO₂/yr</span>
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium",
              ratio > 1
                ? "border-warn/30 bg-warn/10 text-warn"
                : "border-canopy/30 bg-canopy/10 text-canopy-soft",
            )}
          >
            {ratio >= 1 ? `${ratio.toFixed(1)}×` : `${(ratio * 100).toFixed(0)}% of`} India avg
          </span>
        </div>
      </div>

      {/* nav */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => go(-1)}
          disabled={step === 0}
          className={cn(step === 0 && "invisible")}
        >
          <Icon name="ArrowLeft" size={18} />
          Back
        </Button>
        {isLast ? (
          <Button size="lg" onClick={finish}>
            See my footprint
            <Icon name="Sparkles" size={18} />
          </Button>
        ) : (
          <Button size="lg" onClick={() => go(1)}>
            Next
            <Icon name="ArrowRight" size={18} />
          </Button>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-faint">
        ≈ {formatCo2(estimate)} a year · everything stays on your device
      </p>
    </div>
  );
}
