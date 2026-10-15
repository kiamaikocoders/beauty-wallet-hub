export type TierId = "basic" | "intermediate" | "premium";
export const TIER_ORDER: TierId[] = ["basic", "intermediate", "premium"];

export interface TierRule {
  id: TierId;
  name: string;
  priceKsh: number;
  monthlyCoins: number;
  discount: number; // 0..1
  rolloverPct: number; // share of unused coins that roll over
  badge: string | null;
  perks: string[];
}

export interface CoinRules {
  kshPerCoin: number;
  groupSavings: number; // extra discount when bundling 2+ services
  vendorShare: number; // share of cash anchor paid to vendor
  unlockFeePct: number; // extra coins a Basic member pays to book a higher-class provider
  rolloverPct: number;
  tiers: Record<TierId, TierRule>;
}

export const DEFAULT_RULES: CoinRules = {
  kshPerCoin: 10,
  groupSavings: 0.08,
  vendorShare: 0.85,
  unlockFeePct: 0.1,
  rolloverPct: 0.1,
  tiers: {
    basic: {
      id: "basic",
      name: "Basic",
      priceKsh: 7000,
      monthlyCoins: 700,
      discount: 0,
      rolloverPct: 0.1,
      badge: null,
      perks: [
        "Budget salons, barbers and freelancers",
        "Standard booking and walk-ins",
        "Convenience add-ons at standard coin cost",
        "Top up coins anytime",
      ],
    },
    intermediate: {
      id: "intermediate",
      name: "Intermediate",
      priceKsh: 15000,
      monthlyCoins: 1500,
      discount: 0.12,
      rolloverPct: 0.1,
      badge: "Most popular",
      perks: [
        "Basic + intermediate studios",
        "Priority booking",
        "12% fewer coins on every service",
        "Cheaper convenience add-ons",
      ],
    },
    premium: {
      id: "premium",
      name: "Premium",
      priceKsh: 20000,
      monthlyCoins: 2000,
      discount: 0.18,
      rolloverPct: 0.1,
      badge: "Best value",
      perks: [
        "Every provider, incl. premium spaces",
        "Fast-track with multiple professionals",
        "Home and office visits, meal options",
        "18% fewer coins on every service",
      ],
    },
  },
};

export const canAccess = (user: TierId, required: TierId) =>
  TIER_ORDER.indexOf(user) >= TIER_ORDER.indexOf(required);

/** Coin cost of a single service for a given tier. */
export function serviceCoins(cashKsh: number, tier: TierId, rules: CoinRules = DEFAULT_RULES) {
  return Math.round((cashKsh / rules.kshPerCoin) * (1 - rules.tiers[tier].discount));
}

export type MemberPrice =
  { kind: "included"; coins: number } | { kind: "unlock"; coins: number } | { kind: "upgrade" };

/**
 * What a member pays for a service at a provider of a given class.
 * Basic members can unlock higher classes for an extra fee; Intermediate members must upgrade for Premium.
 * Mirrors private.service_coins in the database.
 */
export function memberPrice(
  cashKsh: number,
  memberTier: TierId,
  providerClass: TierId,
  rules: CoinRules = DEFAULT_RULES,
): MemberPrice {
  if (canAccess(memberTier, providerClass))
    return { kind: "included", coins: serviceCoins(cashKsh, memberTier, rules) };
  if (memberTier !== "basic") return { kind: "upgrade" };
  return {
    kind: "unlock",
    coins: Math.round(
      (cashKsh / rules.kshPerCoin) * (1 - rules.tiers.basic.discount) * (1 + rules.unlockFeePct),
    ),
  };
}

/** Total coins for a booking (bundle savings apply when 2+ services). */
export function bookingCoins(
  items: { cashKsh: number }[],
  addOnCoins: number,
  tier: TierId,
  rules: CoinRules = DEFAULT_RULES,
) {
  const base = items.reduce((s, i) => s + serviceCoins(i.cashKsh, tier, rules), 0);
  const bundled = items.length >= 2 ? Math.round(base * (1 - rules.groupSavings)) : base;
  return bundled + addOnCoins;
}

/** Approximate walk-in value of a monthly allowance, rounded to the nearest Ksh 100. */
export function allowanceValueKsh(tier: TierId, rules: CoinRules = DEFAULT_RULES) {
  const t = rules.tiers[tier];
  return Math.round((t.monthlyCoins * rules.kshPerCoin) / (1 - t.discount) / 100) * 100;
}

export const vendorPayout = (cashKsh: number, rules: CoinRules = DEFAULT_RULES) =>
  Math.round(cashKsh * rules.vendorShare);

export const ksh = (n: number) => `Ksh ${n.toLocaleString("en-KE")}`;
export const num = (n: number) => n.toLocaleString("en-KE");
export const pct = (fraction: number) => `${Math.round(fraction * 100)}%`;

export function duration(minutes: number) {
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60} hr${minutes === 60 ? "" : "s"}`;
  return `${minutes} min`;
}
