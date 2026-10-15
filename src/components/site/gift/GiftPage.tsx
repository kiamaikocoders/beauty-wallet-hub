import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { FaqRow, StepCard } from "@/components/site/cards";
import { Icon, Responsive, Section, buttonClass, tierName } from "@/components/site/primitives";
import { ksh, num, pct, type CoinRules, type TierId, TIER_ORDER } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const GIFT_BLURBS: Record<TierId, { desktop: string; mobile?: string }> = {
  basic: {
    desktop: "Cuts, manicures and quick treatments at Basic providers.",
  },
  intermediate: {
    desktop: "Braids, facials and nails, with {discount} off at Intermediate providers.",
  },
  premium: {
    desktop: "Spa days and premium salons, with {discount} off.",
  },
};

function Field({
  label,
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  className,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-2", className)}>
      <span className="type-body-s-medium text-foreground">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[52px] w-full rounded-md border border-border bg-card px-[17px] type-body-m text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground"
      />
    </label>
  );
}

export function GiftPage({ rules }: { rules: CoinRules }) {
  const [tier, setTier] = useState<TierId>("intermediate");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("Happy birthday! Book something lovely on me.");
  const [when, setWhen] = useState<"now" | "date">("now");
  const [from, setFrom] = useState("");
  const [payWith, setPayWith] = useState<"mpesa" | "card">("mpesa");

  const selected = rules.tiers[tier];
  const msgLen = message.length;

  const delivery = when === "now" ? "SMS and email, now" : "SMS and email, on your date";

  return (
    <>
      <Section inner="flex flex-col gap-5 pb-10 pt-5 lg:gap-16 lg:pb-14 lg:pt-16">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-16">
          <div className="order-2 flex min-w-0 flex-1 flex-col gap-5 lg:order-1 lg:gap-5">
            <p className="type-eyebrow text-burgundy">Gift a wallet</p>
            <h1 className="type-display-m text-foreground lg:type-display-l">
              Give someone a month of looking after themselves.
            </h1>
            <p className="type-body-m text-muted-foreground lg:type-body-l">
              <Responsive
                mobile="Send a month of coins. They pick the salon, barber or spa."
                desktop="Send a month of coins to a friend, partner or mum. They pick the salon, barber or spa. You never have to guess."
              />
            </p>
            <div className="hidden gap-3 lg:flex">
              <a href="#choose" className={buttonClass({ variant: "emphasis" })}>
                Choose a gift
              </a>
              <Link to="/how-it-works" className={buttonClass({ variant: "ghost" })}>
                How it works
              </Link>
            </div>
          </div>
          <img
            src="/images/gift/hero.jpg"
            alt="A gift of self-care at a salon"
            className="order-1 h-[262px] w-full rounded-xl object-cover lg:order-2 lg:h-[420px] lg:w-[560px] lg:shrink-0 lg:rounded-xl"
          />
        </div>
      </Section>

      <Section id="choose" inner="flex flex-col gap-5 pb-10 lg:gap-[28px] lg:pb-14">
        <h2 className="type-h2 text-foreground lg:type-h1">Choose a gift</h2>
        <div className="flex flex-col gap-2.5 lg:flex-row lg:gap-5">
          {TIER_ORDER.map((id) => {
            const t = rules.tiers[id];
            const on = tier === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTier(id)}
                className={cn(
                  "flex w-full flex-col text-left transition-colors lg:flex-1",
                  "min-h-[73px] flex-row items-center gap-4 rounded-xl border px-4 py-4 lg:min-h-0 lg:flex-col lg:items-stretch lg:gap-0 lg:p-[25px]",
                  on ? "border-rose bg-blush-subtle" : "border-border bg-card hover:border-rose/60",
                )}
              >
                <span className="lg:hidden">
                  <Icon name={on ? "radio-on" : "radio-off"} size={22} />
                </span>
                <span className="hidden w-full items-center justify-between lg:flex">
                  <span className="type-h4 text-foreground">{t.name}</span>
                  <Icon name={on ? "radio-on" : "radio-off"} size={22} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5 lg:mt-2.5 lg:gap-0">
                  <span className="type-body-s-semibold text-foreground lg:hidden">{t.name}</span>
                  <span className="type-caption text-muted-foreground lg:hidden">
                    {num(t.monthlyCoins)} coins · one month
                  </span>
                  <span className="mt-2 hidden type-h3 text-foreground lg:block">
                    {ksh(t.priceKsh)}
                  </span>
                  <span className="mt-2.5 hidden type-body-s text-muted-foreground lg:block">
                    {num(t.monthlyCoins)} coins · one month
                  </span>
                  <span className="mt-2.5 hidden type-body-s text-muted-foreground lg:block">
                    {id === "basic"
                      ? GIFT_BLURBS.basic.desktop
                      : GIFT_BLURBS[id].desktop.replace("{discount}", pct(t.discount))}
                  </span>
                </span>
                <span className="shrink-0 type-body-s-semibold text-foreground lg:hidden">
                  {ksh(t.priceKsh)}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section inner="flex flex-col gap-6 pb-10 lg:flex-row lg:items-start lg:gap-6 lg:pb-14">
        <div className="flex flex-1 flex-col gap-6 rounded-xl border border-border bg-card p-5 lg:p-8">
          <h2 className="type-h2 text-foreground lg:type-h3">Who is it for?</h2>
          <div className="flex flex-col gap-6 lg:flex-row lg:gap-4">
            <Field
              label="Their name"
              id="gift-name"
              value={name}
              onChange={setName}
              placeholder="Wanjiru Kamau"
              className="flex-1"
            />
            <Field
              label="Their phone number"
              id="gift-phone"
              value={phone}
              onChange={setPhone}
              placeholder="0712 345 678"
              type="tel"
              className="flex-1"
            />
          </div>
          <Field
            label="Their email (optional)"
            id="gift-email"
            value={email}
            onChange={setEmail}
            placeholder="name@example.com"
            type="email"
            className="hidden lg:flex"
          />
          <label className="flex flex-col gap-2">
            <span className="type-body-s-medium text-foreground">Gift message</span>
            <div className="relative rounded-md border border-border bg-card">
              <textarea
                value={message}
                maxLength={160}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="min-h-[112px] w-full resize-none rounded-md bg-transparent px-[17px] py-[17px] type-body-m text-foreground outline-none"
              />
              <span className="pointer-events-none absolute bottom-3 right-4 type-caption text-muted-foreground">
                {msgLen} / 160
              </span>
            </div>
          </label>
          <div className="flex flex-col gap-2">
            <span className="type-body-s-medium text-foreground">When should it arrive?</span>
            <div className="flex rounded-full border border-border bg-muted p-1">
              {(
                [
                  ["now", "Send now"],
                  ["date", "Choose a date"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setWhen(id)}
                  className={cn(
                    "min-h-11 flex-1 rounded-full type-body-s-semibold transition-colors",
                    when === id ? "bg-card text-foreground shadow-soft" : "text-muted-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Field label="From" id="gift-from" value={from} onChange={setFrom} placeholder="Brian" />
        </div>

        <aside className="flex w-full flex-col gap-3.5 rounded-xl border border-border bg-card p-7 lg:w-[420px] lg:shrink-0">
          <p className="type-eyebrow text-muted-foreground">Your gift</p>
          <p className="type-h3 text-foreground">{tierName[tier]} for one month</p>
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between gap-3">
              <span className="type-body-m text-muted-foreground">Gift value</span>
              <span className="type-body-s-semibold text-foreground">{ksh(selected.priceKsh)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="type-body-m text-muted-foreground">Coins they receive</span>
              <span className="type-body-s-semibold text-foreground">
                {num(selected.monthlyCoins)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="type-body-m text-muted-foreground">Delivery</span>
              <span className="type-body-s-semibold text-foreground">{delivery}</span>
            </div>
          </div>
          <div className="h-px w-full bg-border" />
          <div className="flex items-center justify-between gap-3">
            <span className="type-body-m text-muted-foreground">Total</span>
            <span className="type-h3 text-foreground">{ksh(selected.priceKsh)}</span>
          </div>
          <p className="type-body-s-medium text-foreground">Pay with</p>
          <div className="flex gap-2.5">
            {(
              [
                ["mpesa", "M-Pesa"],
                ["card", "Card"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPayWith(id)}
                className={cn(
                  "min-h-11 rounded-full border px-5 type-body-s-semibold",
                  payWith === id
                    ? "border-foreground bg-foreground text-primary-foreground"
                    : "border-border bg-card text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <a
            href={`/join?gift=${tier}`}
            className={buttonClass({ variant: "emphasis", full: true })}
          >
            Pay {ksh(selected.priceKsh)}
          </a>
          <p className="type-caption text-muted-foreground">
            They have 30 days to claim. Unclaimed gifts are refunded to you.
          </p>
        </aside>
      </Section>

      <Section id="how-gifting-works" inner="flex flex-col gap-5 pb-10 lg:gap-[28px] lg:pb-14">
        <h2 className="type-h2 text-foreground lg:type-h1">How gifting works</h2>
        <div className="flex flex-col gap-[14px] lg:flex-row lg:gap-5">
          <StepCard icon="wallet" number="01" title="Pick a plan">
            Choose Basic, Intermediate or Premium for one month.
          </StepCard>
          <StepCard icon="mail" number="02" title="Add a message">
            We send them an SMS and email with a claim link.
          </StepCard>
          <StepCard icon="qr-code" number="03" title="They book">
            They claim with their phone number and book any provider in their tier.
          </StepCard>
        </div>
      </Section>

      <Section inner="flex flex-col gap-5 pb-16 lg:gap-[22px] lg:pb-24">
        <h2 className="type-h2 text-foreground">Gift questions</h2>
        <div className="flex flex-col">
          <FaqRow
            question="Does a gift renew every month?"
            answer="No. A gift covers one month. They can continue on their own plan when it ends."
            defaultOpen
          />
          <FaqRow
            question="Does rollover apply to gifts?"
            answer={`Yes. Up to ${pct(rules.rolloverPct)} of unspent gift coins roll over for one month, like any plan.`}
          />
        </div>
      </Section>
    </>
  );
}
