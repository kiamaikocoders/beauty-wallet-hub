import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TierCard } from "@/components/site/cards";
import { OnboardingShell } from "@/components/site/auth/OnboardingShell";
import { buttonClass } from "@/components/site/primitives";
import { fetchRules } from "@/lib/catalog";
import { ksh, num, pct, type CoinRules, type TierId } from "@/lib/pricing";
import { loadOnboarding, saveOnboarding } from "@/lib/onboarding";

export const Route = createFileRoute("/join/plan")({
  loader: async () => ({ rules: await fetchRules() }),
  head: () => ({
    meta: [
      { title: "Choose your plan — Beauty Wallet" },
      {
        name: "description",
        content: "Change or cancel any time. Coins land in your wallet the moment you pay.",
      },
    ],
  }),
  component: ChoosePlanPage,
});

function ChoosePlanPage() {
  const { rules } = Route.useLoaderData();
  const navigate = useNavigate();
  const existing = loadOnboarding();
  const [selected, setSelected] = useState<TierId>(existing.tier ?? "intermediate");

  const t = rules.tiers[selected];

  function continueNext() {
    saveOnboarding({ tier: selected, step: "preferences" });
    void navigate({ to: "/join/preferences" });
  }

  return (
    <OnboardingShell
      step="plan"
      footer={
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="hidden lg:block">
            <p className="type-body-s-semibold text-foreground">
              {t.name} · {ksh(t.priceKsh)} a month
            </p>
            <p className="type-caption text-muted-foreground">
              {num(t.monthlyCoins)} coins every month · {pct(t.discount)} fewer coins on every
              service
            </p>
          </div>
          <div className="flex w-full gap-3 lg:w-auto">
            <button
              type="button"
              onClick={() => void navigate({ to: "/join/email" })}
              className={buttonClass({ variant: "ghost", className: "hidden lg:inline-flex" })}
            >
              Back
            </button>
            <button
              type="button"
              onClick={continueNext}
              className={buttonClass({ variant: "emphasis", full: true, className: "lg:w-auto" })}
            >
              Continue
            </button>
          </div>
        </div>
      }
    >
      <div className="w-full px-5 py-8 lg:px-16 lg:py-10">
        <div className="mx-auto flex max-w-[720px] flex-col gap-2.5 text-left lg:text-center">
          <h1 className="type-h1 text-foreground">Choose your plan</h1>
          <p className="type-body-m text-muted-foreground lg:type-body-l">
            Change or cancel any time. Coins land in your wallet the moment you pay.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-3">
          {(["basic", "intermediate", "premium"] as TierId[]).map((tier) => (
            <PlanPick
              key={tier}
              tier={tier}
              rules={rules}
              selected={selected === tier}
              onSelect={() => setSelected(tier)}
            />
          ))}
        </div>
      </div>
    </OnboardingShell>
  );
}

function PlanPick({
  tier,
  rules,
  selected,
  onSelect,
}: {
  tier: TierId;
  rules: CoinRules;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div className={selected ? "ring-2 ring-burgundy rounded-xl" : undefined}>
      <TierCard
        tier={tier}
        rules={rules}
        cta={
          <button
            type="button"
            onClick={onSelect}
            className={buttonClass({
              variant:
                tier === "premium" ? "gold" : tier === "intermediate" ? "emphasis" : "secondary",
              full: true,
            })}
          >
            {selected ? `Selected ${rules.tiers[tier].name}` : `Choose ${rules.tiers[tier].name}`}
          </button>
        }
      />
    </div>
  );
}
