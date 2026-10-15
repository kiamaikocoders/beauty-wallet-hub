import { useState } from "react";
import { CheckIcon, Section, SectionHeading } from "@/components/site/primitives";
import {
  allowanceValueKsh,
  ksh,
  num,
  pct,
  type CoinRules,
  type TierId,
  TIER_ORDER,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

type Cell = string | "check" | "dash";

function compareRows(rules: CoinRules): { label: string; values: Record<TierId, Cell> }[] {
  const roll = pct(rules.rolloverPct);
  return [
    {
      label: "Monthly price",
      values: {
        basic: ksh(rules.tiers.basic.priceKsh),
        intermediate: ksh(rules.tiers.intermediate.priceKsh),
        premium: ksh(rules.tiers.premium.priceKsh),
      },
    },
    {
      label: "Coins every month",
      values: {
        basic: num(rules.tiers.basic.monthlyCoins),
        intermediate: num(rules.tiers.intermediate.monthlyCoins),
        premium: num(rules.tiers.premium.monthlyCoins),
      },
    },
    {
      label: "Approx. service value",
      values: {
        basic: ksh(allowanceValueKsh("basic", rules)),
        intermediate: ksh(allowanceValueKsh("intermediate", rules)),
        premium: ksh(allowanceValueKsh("premium", rules)),
      },
    },
    {
      label: "Fewer coins per service",
      values: {
        basic: "—",
        intermediate: pct(rules.tiers.intermediate.discount),
        premium: pct(rules.tiers.premium.discount),
      },
    },
    {
      label: "Providers you can book",
      values: {
        basic: "Basic",
        intermediate: "Basic + Intermediate",
        premium: "All providers",
      },
    },
    {
      label: "Booking",
      values: { basic: "Standard", intermediate: "Priority", premium: "Fast-track" },
    },
    {
      label: "Home and office visits",
      values: { basic: "—", intermediate: "—", premium: "check" },
    },
    {
      label: "Unused coins roll over",
      values: { basic: roll, intermediate: roll, premium: roll },
    },
    {
      label: "Top up anytime",
      values: { basic: "check", intermediate: "check", premium: "check" },
    },
    {
      label: "Unlock higher-tier providers with extra coins",
      values: { basic: "check", intermediate: "check", premium: "Included" },
    },
  ];
}

function CellValue({ value }: { value: Cell }) {
  if (value === "check") {
    return <CheckIcon size={18} className="mx-auto" />;
  }
  return <span className="type-body-s-semibold text-foreground">{value}</span>;
}

export function ComparePlans({ rules }: { rules: CoinRules }) {
  const rows = compareRows(rules);
  const [tier, setTier] = useState<TierId>("intermediate");

  return (
    <Section id="compare" className="bg-card" inner="flex flex-col gap-6 py-14 lg:gap-0 lg:py-24">
      <SectionHeading eyebrow="Compare" title="What each plan includes" className="lg:hidden" />

      <div className="hidden overflow-hidden rounded-xl border border-border lg:block">
        <div className="flex items-center bg-muted px-7 py-5">
          <p className="type-h4 w-[594px] text-foreground">Compare plans</p>
          {TIER_ORDER.map((t) => (
            <div key={t} className="w-[220px] text-center">
              <p className="type-h4 text-foreground">{rules.tiers[t].name}</p>
              {t === "intermediate" && rules.tiers[t].badge && (
                <p className="type-caption text-muted-foreground">{rules.tiers[t].badge}</p>
              )}
            </div>
          ))}
        </div>
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={cn(
              "flex items-center px-7 py-[16.5px]",
              i % 2 === 0 ? "bg-white" : "bg-card",
            )}
          >
            <p className="type-body-s w-[594px] text-muted-foreground">{row.label}</p>
            {TIER_ORDER.map((t) => (
              <div key={t} className="flex w-[220px] justify-center text-center">
                <CellValue value={row.values[t]} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3.5 lg:hidden">
        <div className="flex rounded-full bg-muted p-1">
          {TIER_ORDER.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTier(t)}
              className={cn(
                "type-body-s-semibold min-h-11 flex-1 rounded-full px-1 transition-colors",
                tier === t ? "bg-primary text-primary-foreground" : "text-foreground",
              )}
            >
              {rules.tiers[t].name}
            </button>
          ))}
        </div>
        <div className="overflow-hidden rounded-[20px] border border-border bg-white px-[19px]">
          {rows.map((row, i) => (
            <div
              key={row.label}
              className={cn(
                "flex items-center justify-between gap-3 py-[14.5px]",
                i < rows.length - 1 && "border-b border-border",
              )}
            >
              <p className="type-body-s max-w-[282px] text-muted-foreground">{row.label}</p>
              <div className="shrink-0 text-right">
                <CellValue value={row.values[tier]} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
