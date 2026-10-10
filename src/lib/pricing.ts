export type TierId = "basic" | "intermediate" | "premium";
export const TIER_ORDER: TierId[] = ["basic", "intermediate", "premium"];

export interface TierRule {
  id: TierId;
  name: string;
  priceKsh: number;
  monthlyCoins: number;
  discount: number; // 0..1
  rolloverPct: number; // share of unused coins that roll over
  perks: string[];
}

export interface CoinRules {
  kshPerCoin: number;
  groupSavings: number; // extra discount when bundling 2+ services
  vendorShare: number; // share of cash anchor paid to vendor
  tiers: Record<TierId, TierRule>;
}

export const DEFAULT_RULES: CoinRules = {
  kshPerCoin: 10,
  groupSavings: 0.08,
  vendorShare: 0.85,
  tiers: {
    basic: {
      id: "basic", name: "Basic", priceKsh: 3000, monthlyCoins: 300, discount: 0, rolloverPct: 0,
      perks: ["Budget salons, barbers & freelancers", "Standard booking & walk-ins", "Zero cash on site"],
    },
    intermediate: {
      id: "intermediate", name: "Intermediate", priceKsh: 6500, monthlyCoins: 700, discount: 0.12, rolloverPct: 0.25,
      perks: ["Basic + intermediate studios", "Priority booking", "Cheaper convenience add-ons", "25% coin rollover"],
    },
    premium: {
      id: "premium", name: "Premium", priceKsh: 14000, monthlyCoins: 1600, discount: 0.18, rolloverPct: 0.5,
      perks: ["All providers incl. premium spaces", "Fast-track with multiple pros", "Home services", "50% coin rollover"],
    },
  },
};

export const canAccess = (user: TierId, required: TierId) =>
  TIER_ORDER.indexOf(user) >= TIER_ORDER.indexOf(required);

/** Coin cost of a single service for a given tier. */
export function serviceCoins(cashKsh: number, tier: TierId, rules: CoinRules = DEFAULT_RULES) {
  return Math.round((cashKsh / rules.kshPerCoin) * (1 - rules.tiers[tier].discount));
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

export const vendorPayout = (cashKsh: number, rules: CoinRules = DEFAULT_RULES) =>
  Math.round(cashKsh * rules.vendorShare);

export const ksh = (n: number) => `Ksh ${n.toLocaleString("en-KE")}`;
