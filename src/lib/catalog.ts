import { supabase } from "@/integrations/supabase/client";
import type { ServiceCardData } from "@/components/site/cards";
import { DEFAULT_RULES, serviceCoins, type CoinRules, type TierId } from "./pricing";

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

/** Plans and coin rules from Supabase, shaped like the pricing engine expects. */
export async function fetchRules(): Promise<CoinRules> {
  const [tiers, rules] = await Promise.all([
    supabase.from("tiers").select("*").order("sort").then(unwrap),
    supabase.from("coin_rules").select("*").eq("id", 1).single().then(unwrap),
  ]);
  const next: CoinRules = {
    ...DEFAULT_RULES,
    kshPerCoin: rules.ksh_per_coin,
    groupSavings: Number(rules.group_savings_pct),
    unlockFeePct: Number(rules.unlock_fee_pct),
    rolloverPct: Number(rules.rollover_pct),
    tiers: { ...DEFAULT_RULES.tiers },
  };
  for (const t of tiers) {
    next.tiers[t.id] = {
      id: t.id,
      name: t.name,
      priceKsh: t.price_ksh,
      monthlyCoins: t.monthly_coins,
      discount: Number(t.discount),
      rolloverPct: Number(rules.rollover_pct),
      badge: t.badge,
      perks: t.perks,
    };
  }
  return next;
}

const SERVICE_CARD_COLUMNS =
  "id, name, minutes, cash_ksh, image_url, providers!inner(name, slug, area, class)";

type ServiceCardRow = {
  id: string;
  name: string;
  minutes: number;
  cash_ksh: number;
  image_url: string | null;
  providers: { name: string; slug: string; area: string; class: TierId };
};

/** Coin price shown at the rate of the service's own tier. */
export function toServiceCard(row: ServiceCardRow, rules: CoinRules): ServiceCardData {
  return {
    id: row.id,
    name: row.name,
    minutes: row.minutes,
    cashKsh: row.cash_ksh,
    coins: serviceCoins(row.cash_ksh, row.providers.class, rules),
    imageUrl: row.image_url,
    tier: row.providers.class,
    area: row.providers.area,
    providerName: row.providers.name,
    providerSlug: row.providers.slug,
  };
}

export async function fetchPopularServices(rules: CoinRules, limit = 4) {
  const rows = await supabase
    .from("services")
    .select(SERVICE_CARD_COLUMNS)
    .not("popular_rank", "is", null)
    .order("popular_rank")
    .limit(limit)
    .then(unwrap);
  return (rows as unknown as ServiceCardRow[]).map((r) => toServiceCard(r, rules));
}
