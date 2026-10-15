import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { TierId } from "@/lib/pricing";

export type ButtonVariant =
  "primary" | "emphasis" | "gold" | "secondary" | "ghost" | "secondary-light";
export type ButtonSize = "m" | "s";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-raised",
  emphasis: "bg-burgundy text-white hover:bg-burgundy-hover",
  gold: "bg-gold text-foreground hover:brightness-105",
  secondary: "border border-foreground text-foreground hover:bg-foreground/5",
  "secondary-light":
    "border border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10",
  ghost: "text-burgundy hover:text-burgundy-hover",
};

/** Figma "Button": pill, M = 44px min height, S = 36px. */
export function buttonClass({
  variant = "primary",
  size = "m",
  full = false,
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; full?: boolean; className?: string } = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full transition-colors disabled:pointer-events-none disabled:opacity-50",
    size === "m" ? "type-button-m min-h-11 px-6 py-3" : "type-button-s min-h-9 px-4 py-2",
    buttonVariants[variant],
    full && "w-full",
    className,
  );
}

/** Section wrapper: full-bleed background and content, 20px / 64px side padding. */
export function Section({
  className,
  inner,
  children,
  id,
}: {
  className?: string;
  inner?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className={cn("w-full", className)}>
      <div className={cn("w-full px-5 lg:px-16", inner)}>{children}</div>
    </section>
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) {
  return <p className={cn("type-eyebrow text-burgundy", className)}>{children}</p>;
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  align = "left",
  tone = "light",
  className,
  as: Heading = "h2",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
  as?: "h1" | "h2";
}) {
  const dark = tone === "dark";
  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 lg:gap-3.5",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow && <Eyebrow className={dark ? "text-gold" : undefined}>{eyebrow}</Eyebrow>}
      <Heading className={cn("type-h1", dark ? "text-primary-foreground" : "text-foreground")}>
        {title}
      </Heading>
      {body && (
        <p
          className={cn("type-body-m lg:type-body-l", dark ? "text-gold" : "text-muted-foreground")}
        >
          {body}
        </p>
      )}
    </div>
  );
}

/** Copy that differs between the phone and desktop designs. */
export function Responsive({ mobile, desktop }: { mobile: ReactNode; desktop: ReactNode }) {
  return (
    <>
      <span className="lg:hidden">{mobile}</span>
      <span className="hidden lg:inline">{desktop}</span>
    </>
  );
}

export function Logo({
  tone = "dark",
  className,
}: {
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <img
        src={
          tone === "dark" ? "/images/brand/emblem-on-light.svg" : "/images/brand/emblem-on-dark.svg"
        }
        alt=""
        width={34}
        height={34}
        className="size-[34px]"
      />
      <span
        className={cn(
          "font-display text-[18px] leading-[1.3] tracking-[-0.18px]",
          tone === "dark" ? "text-foreground" : "text-primary-foreground",
        )}
      >
        Beauty Wallet
      </span>
    </span>
  );
}

const checkSrc = {
  burgundy: {
    18: "/images/icons/check-burgundy-18.svg",
    20: "/images/icons/check-burgundy-20.svg",
  },
  gold: { 18: "/images/icons/check-gold-18.svg", 20: "/images/icons/check-gold-20.svg" },
} as const;

export function CheckIcon({
  tone = "burgundy",
  size = 20,
  className,
}: {
  tone?: "burgundy" | "gold";
  size?: 18 | 20;
  className?: string;
}) {
  return (
    <img
      src={checkSrc[tone][size]}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function Icon({
  name,
  size = 24,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={`/images/icons/${name}.svg`}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      style={{ width: size, height: size }}
    />
  );
}

const tierBadgeClass: Record<TierId, string> = {
  basic: "bg-muted border border-border text-foreground",
  intermediate: "bg-blush text-foreground",
  premium: "bg-primary text-gold",
};

export const tierName: Record<TierId, string> = {
  basic: "Basic",
  intermediate: "Intermediate",
  premium: "Premium",
};

/** Figma "Tier Badge". */
export function TierBadge({
  tier,
  className,
  onDark = false,
}: {
  tier: TierId;
  className?: string;
  onDark?: boolean;
}) {
  return (
    <span
      className={cn(
        "type-label-s inline-flex items-center rounded-full px-2 py-1",
        onDark && tier === "premium" ? "bg-primary-raised text-gold" : tierBadgeClass[tier],
        className,
      )}
    >
      {tierName[tier]}
    </span>
  );
}

/** Figma "Coin Chip". Light on cream surfaces, Dark on charcoal. */
export function CoinChip({
  children,
  tone = "light",
  className,
}: {
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full py-1 pl-2 pr-3",
        tone === "dark"
          ? "bg-primary-raised text-gold"
          : "border border-border bg-card text-foreground",
        className,
      )}
    >
      <img src="/images/icons/coin.svg" alt="" width={16} height={16} className="size-4" />
      <span className="type-body-s-semibold whitespace-nowrap">{children}</span>
    </span>
  );
}
