import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { OnboardingShell } from "@/components/site/auth/OnboardingShell";
import { MomentLottie } from "@/components/site/MomentLottie";
import { TierBadge, buttonClass } from "@/components/site/primitives";
import { fetchRules } from "@/lib/catalog";
import {
  firstName,
  formatRenewal,
  formatRenewalShort,
  loadOnboarding,
  renewalDate,
} from "@/lib/onboarding";
import { ksh, num, pct, type TierId } from "@/lib/pricing";
import { announce } from "@/lib/notices";
import { notifyEmail } from "@/lib/resend";

export const Route = createFileRoute("/join/success")({
  loader: async () => ({ rules: await fetchRules() }),
  head: () => ({
    meta: [
      { title: "You’re in — Beauty Wallet" },
      { name: "description", content: "Payment received. Your coins are in your wallet." },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { rules } = Route.useLoaderData();
  const onboarding = loadOnboarding();
  const tier = (onboarding.tier ?? "intermediate") as TierId;
  const t = rules.tiers[tier];
  const renews = renewalDate();
  const methodLabel = onboarding.paymentMethod === "card" ? "Paid by card" : "Paid by M-Pesa";
  const mailed = useRef(false);

  useEffect(() => {
    if (mailed.current) return;
    const to = onboarding.email?.trim();
    if (!to || !to.includes("@")) return;
    mailed.current = true;
    announce("plan_started");
    const origin = window.location.origin;
    const name = firstName(onboarding.fullName);
    notifyEmail({
      to,
      template: "welcome",
      data: {
        firstName: name,
        fullName: onboarding.fullName,
        email: to,
        tier: t.name,
        planPrice: ksh(t.priceKsh),
        coins: num(t.monthlyCoins),
        discount: pct(t.discount),
        renewalDate: formatRenewal(renews),
        ctaUrl: `${origin}/app`,
      },
    });
    notifyEmail({
      to,
      template: "plan-receipt",
      data: {
        firstName: name,
        tier: t.name,
        amount: ksh(t.priceKsh),
        receiptId: onboarding.paymentRef ?? "BW-PAY",
        paidWith: methodLabel,
        mpesaRef: onboarding.paymentRef ?? "—",
        date: formatRenewal(new Date()),
        coinsAdded: num(t.monthlyCoins),
        rolledOver: "0",
        walletNow: num(t.monthlyCoins),
        ctaUrl: `${origin}/app/wallet`,
      },
    });
  }, [methodLabel, onboarding, renews, t]);

  return (
    <OnboardingShell step="payment" hideSaveExit>
      <div className="flex w-full flex-1 flex-col gap-10 px-5 py-8 lg:flex-row lg:items-center lg:justify-center lg:gap-16 lg:px-16 lg:py-12">
        <div className="flex w-full max-w-[536px] flex-col gap-5">
          <MomentLottie name="check" size={72} />
          <p className="type-eyebrow text-success">Payment received</p>
          <div className="flex flex-col gap-2.5">
            <h1 className="type-h1 text-foreground">
              You’re in, {firstName(onboarding.fullName)}.
            </h1>
            <p className="type-body-m text-muted-foreground lg:type-body-l">
              {num(t.monthlyCoins)} coins are in your wallet. Your plan renews on{" "}
              {formatRenewal(renews)}.
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-white p-[18px]">
            <div className="flex justify-between type-body-s">
              <span className="text-muted-foreground">{methodLabel}</span>
              <span className="type-body-s-semibold text-foreground">{ksh(t.priceKsh)}</span>
            </div>
            <div className="flex justify-between type-body-s">
              <span className="text-muted-foreground">Reference</span>
              <span className="type-body-s-semibold text-foreground">
                {onboarding.paymentRef ?? "BW-PAY-…"}
              </span>
            </div>
            <p className="type-caption text-muted-foreground">
              Receipt sent to {onboarding.email || "your email"}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/explore" className={buttonClass({ variant: "emphasis" })}>
              Explore services
            </Link>
            <a href="/app" className={buttonClass({ variant: "secondary" })}>
              Add to home screen
            </a>
          </div>
          <a href="/app" className="type-body-s-semibold text-burgundy">
            Go to my wallet →
          </a>
        </div>

        <div className="flex w-full max-w-[440px] flex-col items-center gap-4 rounded-[28px] bg-blush p-8 lg:p-10">
          <div className="flex w-full max-w-[360px] flex-col gap-5 rounded-xl bg-primary p-6 shadow-raised">
            <div className="flex items-center justify-between">
              <p className="type-h4 text-primary-foreground">Beauty Wallet</p>
              <TierBadge tier={tier} />
            </div>
            <div>
              <p className="type-eyebrow text-gold">Available coins</p>
              <p className="type-coin-xl text-primary-foreground">{num(t.monthlyCoins)}</p>
              <p className="type-body-s text-gold">≈ {ksh(t.priceKsh)} in service value</p>
            </div>
            <div className="h-px w-full bg-primary-raised" />
            <div className="flex gap-6">
              <Meta label="On hold" value="0 coins" />
              <Meta label={`Rolls over (${pct(rules.rolloverPct)})`} value="0 coins" />
              <Meta label="Renews" value={formatRenewalShort(renews)} />
            </div>
          </div>
          <p className="max-w-[360px] text-center type-caption text-muted-foreground">
            Your wallet, live. Coins on hold appear here when you book.
          </p>
        </div>
      </div>
    </OnboardingShell>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col gap-0.5">
      <p className="type-caption text-gold">{label}</p>
      <p className="type-body-s-semibold text-primary-foreground">{value}</p>
    </div>
  );
}
