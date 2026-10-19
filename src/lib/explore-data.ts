import type { ServiceCardData } from "@/components/site/cards";
import { supabase } from "@/integrations/supabase/client";
import { toServiceCard, fetchRules } from "@/lib/catalog";
import type { CoinRules, TierId } from "@/lib/pricing";

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export type ExploreCategory = { slug: string; name: string };

export type ExploreSort = "recommended" | "price-asc" | "price-desc" | "duration";

export type ExploreFilters = {
  q?: string;
  area?: string;
  category?: string;
  tier?: TierId;
  sort?: ExploreSort;
  date?: string;
  home?: boolean;
  coinsMin?: number;
  coinsMax?: number;
  today?: boolean;
  before8?: boolean;
};

const SERVICE_COLUMNS =
  "id, name, minutes, cash_ksh, image_url, category, popular_rank, providers!inner(name, slug, area, class, status, home_visits, hours)";

type ExploreServiceRow = {
  id: string;
  name: string;
  minutes: number;
  cash_ksh: number;
  image_url: string | null;
  category: string;
  popular_rank: number | null;
  providers: {
    name: string;
    slug: string;
    area: string;
    class: TierId;
    status: string;
    home_visits: boolean;
    hours: { days?: string; open?: string }[] | null;
  };
};

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function hoursCoverToday(hours: { days?: string }[] | null): boolean {
  if (!hours?.length) return false;
  const today = new Date()
    .toLocaleDateString("en-US", { weekday: "short", timeZone: "Africa/Nairobi" })
    .slice(0, 3)
    .toLowerCase();
  return hours.some((row) => {
    const days = (row.days ?? "").toLowerCase();
    if (!days) return true;
    if (days.includes(today)) return true;
    const parts = days.split(/–|-|to/).map((part) => part.trim().slice(0, 3));
    if (parts.length !== 2) return false;
    const start = WEEKDAYS.indexOf(parts[0] ?? "");
    const end = WEEKDAYS.indexOf(parts[1] ?? "");
    const now = WEEKDAYS.indexOf(today);
    return start >= 0 && end >= 0 && now >= start && now <= end;
  });
}

function opensBeforeEight(hours: { open?: string }[] | null): boolean {
  return Boolean(hours?.some((row) => (row.open ?? "") < "08:00" && (row.open ?? "") !== ""));
}

export async function fetchExploreCategories(): Promise<ExploreCategory[]> {
  return supabase.from("categories").select("slug, name").order("sort").then(unwrap);
}

export async function fetchExploreCounts() {
  const [services, providers] = await Promise.all([
    supabase
      .from("services")
      .select("id, providers!inner(status)", { count: "exact", head: true })
      .eq("active", true)
      .eq("providers.status", "live")
      .then(({ count, error }) => {
        if (error) throw new Error(error.message);
        return count ?? 0;
      }),
    supabase
      .from("providers")
      .select("id", { count: "exact", head: true })
      .eq("status", "live")
      .then(({ count, error }) => {
        if (error) throw new Error(error.message);
        return count ?? 0;
      }),
  ]);
  return { serviceCount: services, providerCount: providers };
}

export async function fetchExploreServices(
  rules: CoinRules,
  filters: ExploreFilters = {},
): Promise<ServiceCardData[]> {
  let query = supabase
    .from("services")
    .select(SERVICE_COLUMNS)
    .eq("active", true)
    .eq("providers.status", "live");

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.tier) query = query.eq("providers.class", filters.tier);
  if (filters.area) query = query.eq("providers.area", filters.area);
  if (filters.home) query = query.eq("providers.home_visits", true);

  const rows = await query
    .order("popular_rank", { ascending: true, nullsFirst: false })
    .order("sort")
    .then(unwrap);

  let matched = rows as unknown as ExploreServiceRow[];
  if (filters.today) matched = matched.filter((row) => hoursCoverToday(row.providers.hours));
  if (filters.before8) matched = matched.filter((row) => opensBeforeEight(row.providers.hours));

  let cards = matched.map((r) => toServiceCard(r, rules));

  if (filters.q?.trim()) {
    const q = filters.q.trim().toLowerCase();
    cards = cards.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.providerName.toLowerCase().includes(q) ||
        c.area.toLowerCase().includes(q),
    );
  }
  if (filters.coinsMin != null) cards = cards.filter((c) => c.coins >= filters.coinsMin!);
  if (filters.coinsMax != null) cards = cards.filter((c) => c.coins <= filters.coinsMax!);

  const sort = filters.sort ?? "recommended";
  if (sort === "price-asc") cards = [...cards].sort((a, b) => a.coins - b.coins);
  else if (sort === "price-desc") cards = [...cards].sort((a, b) => b.coins - a.coins);
  else if (sort === "duration") cards = [...cards].sort((a, b) => a.minutes - b.minutes);

  return cards;
}

export async function loadExplorePage(filters: ExploreFilters) {
  const rules = await fetchRules();
  const [categories, counts, services] = await Promise.all([
    fetchExploreCategories(),
    fetchExploreCounts(),
    fetchExploreServices(rules, filters),
  ]);
  return { rules, categories, ...counts, services };
}

export const AREAS = ["Westlands", "Kilimani", "Karen", "Lavington", "Kileleshwa", "CBD"] as const;

export const SORT_LABELS: Record<ExploreSort, string> = {
  recommended: "Recommended",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  duration: "Duration",
};
