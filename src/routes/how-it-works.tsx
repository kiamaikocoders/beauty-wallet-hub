import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FaqRow, ServiceCard, WalletCard } from "@/components/site/cards";
import { ArrivalPass } from "@/components/site/how-it-works/ArrivalPass";
import { CoinMaths } from "@/components/site/how-it-works/CoinMaths";
import { howItWorksFaqs } from "@/components/site/how-it-works/faqs";
import { ReceiptCard } from "@/components/site/how-it-works/ReceiptCard";
import { SitePage } from "@/components/site/SitePage";
import {
  CheckIcon,
  Icon,
  Responsive,
  Section,
  SectionHeading,
  buttonClass,
} from "@/components/site/primitives";
import { fetchRules } from "@/lib/catalog";
import { DEFAULT_RULES, memberPrice, num, pct, serviceCoins, type CoinRules } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — Beauty Wallet" },
      {
        name: "description",
        content:
          "Pre-pay your beauty month. Spend coins, not cash, at vetted salons, barbers and spas across Nairobi.",
      },
    ],
  }),
  loader: async () => {
    try {
      return { rules: await fetchRules() };
    } catch {
      return { rules: DEFAULT_RULES };
    }
  },
  component: HowItWorks,
});

const TRUST = [
  {
    icon: "lock",
    title: "Coins held, not spent",
    body: "Booked coins sit “on hold” and only reach the provider after your PIN check-in.",
  },
  {
    icon: "shield-check",
    title: "Vetted providers only",
    body: "Every salon, barber and spa is visited and checked before taking bookings.",
  },
  {
    icon: "refresh",
    title: "Plans that bend",
    body: "Upgrade, downgrade or cancel your plan anytime from your wallet.",
  },
  {
    icon: "check",
    title: "Fix-it promise",
    body: "If a service doesn’t go well, tell us within 48 hours and we’ll make it right.",
  },
] as const;

function priceBullets(rules: CoinRules) {
  const prices = [
    num(rules.tiers.basic.priceKsh),
    num(rules.tiers.intermediate.priceKsh),
    num(rules.tiers.premium.priceKsh),
  ];
  return [
    `Ksh ${prices[0]}, ${prices[1]} or ${prices[2]} a month`,
    "Top up anytime if you run low",
    `${pct(rules.rolloverPct)} of unused coins roll over`,
  ];
}

function HowItWorks() {
  const { rules } = Route.useLoaderData();
  const rollover = pct(rules.rolloverPct);
  const braidsCoins = serviceCoins(6000, "intermediate", rules);
  const braidsPrice = memberPrice(6000, "intermediate", "intermediate", rules);
  const demoBalance = 1520;
  const walletAfter =
    braidsPrice.kind === "included" ? demoBalance - braidsPrice.coins : demoBalance;

  const demoService = {
    id: "demo-braids",
    name: "Knotless Braids, Medium",
    minutes: 300,
    cashKsh: 6000,
    coins: braidsCoins,
    imageUrl: "/images/how-it-works/knotless-braids.jpg",
    tier: "intermediate" as const,
    area: "Kilimani",
    providerName: "Braid Bar Ngong Rd",
    providerSlug: "braid-bar-ngong-rd",
  };

  return (
    <SitePage>
      <Section inner="flex flex-col gap-5 pb-14 pt-6 lg:flex-row lg:items-center lg:gap-16 lg:pb-24 lg:pt-16">
        <div className="flex min-w-0 flex-1 flex-col gap-5 lg:gap-5">
          <p className="type-eyebrow text-burgundy">How it works</p>
          <h1 className="type-display-m text-foreground lg:type-display-l">
            Pre-pay your beauty month. Spend coins, not cash.
          </h1>
          <p className="type-body-m text-muted-foreground lg:type-body-l">
            <Responsive
              mobile="Turn your grooming budget into coins for vetted salons, barbers and spas across Nairobi. Providers are only paid once your service is done."
              desktop="Beauty Wallet turns your monthly grooming budget into coins you can spend at vetted salons, barbers and spas across Nairobi. Nothing changes hands at the salon, and providers are only paid once your service is done."
            />
          </p>
          <div className="flex flex-col gap-2.5 lg:flex-row lg:gap-3">
            <Link
              to="/pricing"
              className={buttonClass({ variant: "emphasis", className: "w-full lg:w-auto" })}
            >
              Choose your plan
            </Link>
            <Link
              to="/explore"
              className={buttonClass({
                variant: "secondary",
                className: "hidden lg:inline-flex",
              })}
            >
              Explore services
            </Link>
          </div>
        </div>
        <img
          src="/images/how-it-works/hero.jpg"
          alt="A member checking in at a salon reception"
          className="h-[280px] w-full rounded-xl object-cover lg:h-[480px] lg:w-[620px] lg:shrink-0 lg:rounded-[28px]"
        />
      </Section>

      <Section className="bg-card" inner="flex flex-col gap-10 py-14 lg:gap-12 lg:py-24">
        <SectionHeading eyebrow="Four steps" title="From subscription to service" />

        <StepRow
          number="01"
          title="Subscribe and get your coins"
          body="Pick Basic, Intermediate or Premium and pay with M-Pesa or card. Your coins land in your wallet straight away and refresh every month."
          bullets={priceBullets(rules)}
          visual="muted"
          reverse={false}
        >
          <WalletCard
            className="w-full max-w-[360px]"
            coins="1,520"
            value="≈ Ksh 15,200 in service value"
            onHold="308 coins"
            rollover="152 coins"
            rolloverLabel={`Rolls over (${rollover})`}
            renews="1 Nov"
          />
        </StepRow>

        <StepRow
          number="02"
          title="Book a vetted provider"
          body="Browse salons, barbers, spas and freelancers near you. Every service shows the walk-in price in Ksh and your price in coins."
          bullets={[
            "Filter by area, category and time",
            "Bundle services in one visit",
            "Higher tiers pay fewer coins",
          ]}
          visual="blush"
          reverse
        >
          <ServiceCard service={demoService} className="w-full max-w-[320px]" />
        </StepRow>

        <StepRow
          number="03"
          title="Arrive with your PIN"
          body="Coins move to “on hold” when you book. At the salon, show your 4-digit arrival PIN. No cash, no card machine."
          bullets={[
            "Your PIN is only valid for this booking",
            "Running late? Message the provider in the app",
          ]}
          visual="muted"
          reverse={false}
        >
          <ArrivalPass details={`Sat 10:00 · ${num(braidsCoins)} coins on hold`} />
        </StepRow>

        <StepRow
          number="04"
          title="Coins go to the provider when you’re done"
          body="Once the service is complete the coins are released to the provider and we pay them out. You rate the visit and your balance updates."
          bullets={[
            "Something wrong? Tell us within 48 hours",
            "Providers are paid weekly to M-Pesa or bank",
          ]}
          visual="blush"
          reverse
        >
          <ReceiptCard
            serviceLine="Knotless Braids, Medium · Braid Bar Ngong Rd"
            coinsReleased={`${num(braidsCoins)} coins`}
            walletBalance={`${num(walletAfter)} coins`}
          />
        </StepRow>
      </Section>

      <CoinMaths rules={rules} />

      <Section inner="flex flex-col gap-6 py-14 lg:gap-12 lg:py-24">
        <SectionHeading
          eyebrow="Built on trust"
          title="Your coins are protected at every step"
          className="lg:w-[720px]"
        />
        <div className="flex flex-col gap-3 lg:flex-row lg:gap-6">
          {TRUST.map((card) => (
            <div
              key={card.title}
              className="flex flex-1 flex-col gap-3 rounded-[20px] border border-border bg-card p-6"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-blush">
                <Icon name={card.icon} size={24} />
              </span>
              <h3 className="type-h4 text-foreground">{card.title}</h3>
              <p className="type-body-s text-muted-foreground">{card.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section inner="flex flex-col gap-5 py-14 lg:flex-row lg:items-start lg:gap-20 lg:py-24">
        <div className="flex flex-col gap-6 lg:w-[400px] lg:shrink-0">
          <SectionHeading
            eyebrow="FAQ"
            title="Common questions"
            body={<span className="hidden lg:inline">More answers in the help centre.</span>}
          />
          <Link
            to="/help"
            className={buttonClass({
              variant: "secondary",
              className: "hidden self-start lg:inline-flex",
            })}
          >
            Visit the help centre
          </Link>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          {howItWorksFaqs(rules).map((f, i) => (
            <FaqRow
              key={f.question}
              defaultOpen={i === 0}
              question={f.question}
              answer={f.answer}
            />
          ))}
        </div>
        <Link
          to="/help"
          className={buttonClass({ variant: "secondary", full: true, className: "lg:hidden" })}
        >
          Visit the help centre
        </Link>
      </Section>

      <Section inner="pb-14 lg:pb-24">
        <div className="flex flex-col gap-4 rounded-xl bg-blush px-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:rounded-[32px] lg:p-16">
          <div className="flex flex-col gap-4 text-foreground lg:w-[640px] lg:gap-3">
            <h2 className="type-h1">Ready to plan your beauty month?</h2>
            <p className="type-body-m lg:type-body-l">
              <Responsive
                mobile="Join in two minutes with your phone number."
                desktop="Join in two minutes with your phone number. Pay with M-Pesa or card."
              />
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/pricing" className={buttonClass({ className: "w-full lg:w-auto" })}>
              Choose your plan
            </Link>
            <Link
              to="/explore"
              className={buttonClass({ variant: "secondary", className: "hidden lg:inline-flex" })}
            >
              Explore services
            </Link>
          </div>
        </div>
      </Section>
    </SitePage>
  );
}

function StepRow({
  number,
  title,
  body,
  bullets,
  visual,
  reverse,
  children,
}: {
  number: string;
  title: string;
  body: string;
  bullets: string[];
  visual: "muted" | "blush";
  reverse: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 lg:items-center lg:gap-24",
        reverse ? "lg:flex-row-reverse" : "lg:flex-row",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-4 lg:max-w-[656px]">
        <p className="font-sans text-[24px] font-medium leading-none tracking-[-0.48px] text-border">
          {number}
        </p>
        <h3 className="type-h1 text-foreground">{title}</h3>
        <p className="type-body-m text-muted-foreground lg:type-body-l">{body}</p>
        <ul className="flex flex-col gap-2.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5">
              <CheckIcon size={18} className="mt-0.5" />
              <span className="type-body-m text-foreground">{b}</span>
            </li>
          ))}
        </ul>
      </div>
      <div
        className={cn(
          "flex w-full items-center justify-center rounded-[28px] p-7 lg:w-[560px] lg:shrink-0 lg:p-12",
          visual === "muted" ? "bg-muted" : "bg-blush-subtle",
        )}
      >
        {children}
      </div>
    </div>
  );
}
