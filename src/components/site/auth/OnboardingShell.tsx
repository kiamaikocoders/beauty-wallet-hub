import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Icon, Logo, buttonClass } from "@/components/site/primitives";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "account", label: "Account", n: 1 },
  { key: "plan", label: "Plan", n: 2 },
  { key: "preferences", label: "Preferences", n: 3 },
  { key: "payment", label: "Payment", n: 4 },
] as const;

export type OnboardingStepKey = (typeof STEPS)[number]["key"];

function StepMark({ state, n }: { state: "done" | "active" | "todo"; n: number }) {
  if (state === "done") {
    return (
      <span className="flex size-7 items-center justify-center rounded-full bg-blush">
        <Icon name="check" size={16} />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="flex size-7 items-center justify-center rounded-full bg-primary type-caption font-bold text-primary-foreground">
        {n}
      </span>
    );
  }
  return (
    <span className="flex size-7 items-center justify-center rounded-full border border-border type-caption font-bold text-muted-foreground">
      {n}
    </span>
  );
}

export function OnboardingShell({
  step,
  children,
  footer,
  hideSaveExit,
  mobileTitle,
}: {
  step: OnboardingStepKey;
  children: ReactNode;
  footer?: ReactNode;
  hideSaveExit?: boolean;
  mobileTitle?: string;
}) {
  const activeIdx = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background">
      <header className="flex h-14 items-center border-b border-border px-5 lg:h-20 lg:px-12">
        <div className="flex flex-1 items-center">
          <Link to="/" className="hidden lg:inline-flex">
            <Logo />
          </Link>
          <button
            type="button"
            className="flex size-11 items-center justify-center lg:hidden"
            onClick={() => window.history.back()}
            aria-label="Back"
          >
            <img
              src="/images/icons/chevron-right.svg"
              alt=""
              width={24}
              height={24}
              className="size-6 rotate-180"
            />
          </button>
          {mobileTitle ? (
            <p className="type-body-s-semibold text-foreground lg:hidden">{mobileTitle}</p>
          ) : null}
        </div>

        <nav className="hidden items-center gap-3 lg:flex">
          {STEPS.map((s, i) => {
            const state = i < activeIdx ? "done" : i === activeIdx ? "active" : "todo";
            return (
              <div key={s.key} className="flex items-center gap-3">
                {i > 0 ? <span className="h-px w-8 bg-foreground" /> : null}
                <div className="flex items-center gap-2">
                  <StepMark state={state} n={s.n} />
                  <span className="type-body-s-medium text-foreground">{s.label}</span>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="flex flex-1 justify-end">
          {!hideSaveExit ? (
            <Link
              to="/"
              className={cn(buttonClass({ variant: "ghost", size: "s" }), "hidden lg:inline-flex")}
            >
              Save and exit
            </Link>
          ) : null}
          <div className="flex w-[200px] gap-1.5 lg:hidden">
            {STEPS.map((s, i) => (
              <div
                key={s.key}
                className={cn(
                  "h-1 flex-1 rounded-[2px]",
                  i <= activeIdx ? "bg-burgundy" : "bg-border",
                )}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>

      {footer ? (
        <footer className="sticky bottom-0 border-t border-border bg-card px-5 py-4 lg:px-12 lg:py-5">
          {footer}
        </footer>
      ) : null}
    </div>
  );
}

export function OrderSummaryCard({
  tierName,
  priceLabel,
  coins,
  renewal,
  note,
}: {
  tierName: string;
  priceLabel: string;
  coins: string;
  renewal: string;
  note: string;
}) {
  return (
    <aside className="flex w-full flex-col rounded-2xl bg-primary p-8 text-primary-foreground lg:w-[400px] lg:shrink-0">
      <p className="type-eyebrow text-gold">Your plan</p>
      <p className="mt-2 type-h2 text-primary-foreground">{tierName}</p>
      <div className="mt-6 flex flex-col gap-3.5">
        <Row label="Monthly price" value={priceLabel} />
        <Row label="Coins each month" value={coins} />
        <Row label="First renewal" value={renewal} />
      </div>
      <div className="my-4 h-px w-full bg-primary-raised" />
      <div className="flex items-center justify-between">
        <span className="type-body-m text-primary-foreground">Due today</span>
        <span className="type-stat text-primary-foreground">{priceLabel}</span>
      </div>
      <p className="mt-4 type-caption text-gold/90">{note}</p>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="type-body-m text-primary-foreground/80">{label}</span>
      <span className="type-body-s-semibold whitespace-nowrap text-primary-foreground">
        {value}
      </span>
    </div>
  );
}
