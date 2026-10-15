import { useId, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  allowanceValueKsh,
  duration,
  ksh,
  num,
  pct,
  type CoinRules,
  type TierId,
} from "@/lib/pricing";
import { CheckIcon, CoinChip, Icon, TierBadge, buttonClass, tierName } from "./primitives";

/** Figma "Tier Card" (Home and Pricing). */
export function TierCard({
  tier,
  rules,
  className,
  cta,
}: {
  tier: TierId;
  rules: CoinRules;
  className?: string;
  cta?: ReactNode;
}) {
  const t = rules.tiers[tier];
  const premium = tier === "premium";
  const intermediate = tier === "intermediate";
  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-xl p-8",
        premium
          ? "bg-primary"
          : intermediate
            ? "border border-rose bg-blush-subtle"
            : "border border-border bg-card",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className={cn("type-h2", premium ? "text-primary-foreground" : "text-foreground")}>
          {t.name}
        </h3>
        {t.badge && (
          <span
            className={cn(
              "type-label-s rounded-full px-2.5 py-1",
              premium ? "bg-gold text-foreground" : "bg-burgundy text-white",
            )}
          >
            {t.badge}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5 whitespace-nowrap">
        <p className={cn("type-stat", premium ? "text-primary-foreground" : "text-foreground")}>
          {ksh(t.priceKsh)}
        </p>
        <p className={cn("type-body-s", premium ? "text-gold" : "text-muted-foreground")}>
          / month
        </p>
      </div>
      <div className="flex flex-col items-start gap-1.5">
        <CoinChip tone={premium ? "dark" : "light"}>
          {num(t.monthlyCoins)} coins every month
        </CoinChip>
        <p className={cn("type-caption", premium ? "text-gold" : "text-muted-foreground")}>
          About {ksh(allowanceValueKsh(tier, rules))} of services
        </p>
      </div>
      <div className={cn("h-px w-full", premium ? "bg-primary-raised" : "bg-border")} />
      <ul className="flex flex-col gap-3">
        {[...t.perks, `${pct(t.rolloverPct)} of unused coins roll over`].map((perk) => (
          <li key={perk} className="flex items-start gap-2.5">
            <CheckIcon tone={premium ? "gold" : "burgundy"} />
            <span
              className={cn(
                "type-body-s flex-1",
                premium ? "text-primary-foreground" : "text-foreground",
              )}
            >
              {perk}
            </span>
          </li>
        ))}
      </ul>
      {cta ?? (
        <a
          href={`/join?plan=${tier}`}
          className={buttonClass({
            variant: premium ? "gold" : intermediate ? "primary" : "secondary",
            full: true,
          })}
        >
          Choose {tierName[tier]}
        </a>
      )}
    </div>
  );
}

export interface ServiceCardData {
  id: string;
  name: string;
  minutes: number;
  cashKsh: number;
  coins: number;
  imageUrl: string | null;
  tier: TierId;
  area: string;
  providerName: string;
  providerSlug: string;
}

/** Figma "Service Card" (marketplace tile). */
export function ServiceCard({
  service,
  className,
}: {
  service: ServiceCardData;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-border bg-card",
        className,
      )}
    >
      <div className="relative flex h-[150px] items-start bg-muted pl-3 pt-3">
        {service.imageUrl && (
          <img
            src={service.imageUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
        )}
        <TierBadge tier={service.tier} className="relative" />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="type-caption text-muted-foreground">
          {service.area} · {duration(service.minutes)}
        </p>
        <h3 className="type-h3 text-foreground">{service.name}</h3>
        <p className="type-body-s text-muted-foreground">{service.providerName}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex flex-col whitespace-nowrap">
            <p className="type-caption text-muted-foreground">{ksh(service.cashKsh)}</p>
            <p className="type-body-s-semibold text-foreground">{num(service.coins)} coins</p>
          </div>
          <Link
            to="/p/$slug"
            params={{ slug: service.providerSlug }}
            search={{ service: service.id }}
            className={buttonClass({ size: "s" })}
            aria-label={`Book ${service.name} at ${service.providerName}`}
          >
            Book
          </Link>
        </div>
      </div>
    </article>
  );
}

/** Figma "Wallet Card": charcoal balance card. */
export function WalletCard({
  tier = "premium",
  coins,
  value,
  onHold,
  rollover,
  rolloverLabel = "Rolls over (10%)",
  renews,
  className,
}: {
  tier?: TierId;
  coins: string;
  value: string;
  onHold: string;
  rollover: string;
  rolloverLabel?: string;
  renews: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-xl bg-primary p-6 drop-shadow-[0_12px_16px_rgba(34,31,36,0.12)]",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="font-display text-[18px] leading-[1.3] text-primary-foreground">
          Beauty Wallet
        </p>
        <TierBadge tier={tier} onDark />
      </div>
      <div className="flex flex-col gap-1 whitespace-nowrap">
        <p className="type-eyebrow text-gold">Available coins</p>
        <p className="type-coin-xl text-primary-foreground">{coins}</p>
        <p className="type-body-s text-gold">{value}</p>
      </div>
      <div className="h-px w-full bg-primary-raised" />
      <div className="flex gap-6 whitespace-nowrap">
        {[
          ["On hold", onHold],
          [rolloverLabel, rollover],
          ["Renews", renews],
        ].map(([label, v]) => (
          <div key={label} className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="type-caption text-gold">{label}</p>
            <p className="type-body-s-semibold text-primary-foreground">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Figma "Step Card". */
export function StepCard({
  icon,
  number,
  title,
  children,
}: {
  icon: string;
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col gap-4 rounded-xl border border-border bg-card p-8">
      <div className="flex items-center justify-between">
        <span className="flex size-[52px] items-center justify-center rounded-full bg-blush">
          <Icon name={icon} />
        </span>
        <span className="font-sans text-[40px] font-medium leading-none tracking-[-0.8px] text-border">
          {number}
        </span>
      </div>
      <h3 className="type-h3 text-foreground">{title}</h3>
      <p className="type-body-s text-muted-foreground">{children}</p>
    </div>
  );
}

/** Figma "Testimonial Card". */
export function TestimonialCard({
  quote,
  name,
  meta,
  avatar,
}: {
  quote: ReactNode;
  name: string;
  meta: string;
  avatar: string;
}) {
  return (
    <figure className="flex w-full flex-col gap-6 rounded-xl border border-border bg-card p-8">
      <blockquote className="type-h3 text-foreground">{quote}</blockquote>
      <figcaption className="flex items-center gap-3.5">
        <img
          src={avatar}
          alt=""
          width={52}
          height={52}
          className="size-[52px] rounded-full object-cover"
        />
        <span className="flex flex-col gap-0.5 whitespace-nowrap">
          <span className="type-body-s-semibold text-foreground">{name}</span>
          <span className="type-caption text-muted-foreground">{meta}</span>
        </span>
      </figcaption>
    </figure>
  );
}

/** Figma "FAQ Row": accordion row, open shows the answer. */
export function FaqRow({
  question,
  answer,
  defaultOpen = false,
}: {
  question: ReactNode;
  answer: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={cn("flex w-full flex-col border-b border-border py-[22px]", open && "gap-2.5")}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-11 w-full items-center gap-4 text-left -my-2.5"
      >
        <span className="type-body-m-medium flex-1 text-foreground">{question}</span>
        <Icon name={open ? "chevron-up" : "chevron-down"} />
      </button>
      {open && (
        <div id={id} className="type-body-m text-muted-foreground">
          {answer}
        </div>
      )}
    </div>
  );
}
