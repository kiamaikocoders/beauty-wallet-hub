import { supabase } from "@/integrations/supabase/client";
import { fetchRules, toServiceCard } from "@/lib/catalog";
import { DEFAULT_RULES, memberPrice, num, type CoinRules, type TierId } from "@/lib/pricing";
import type { ServiceCardData } from "@/components/site/cards";

export type MemberSession = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  area: string | null;
  tier: TierId;
  tierName: string;
  status: string;
  renewsOn: string | null;
  avatarUrl: string;
  createdAt: string;
  monthlyCoins: number;
  priceKsh: number;
  wallet: { available: number; onHold: number; rollover: number };
  demo: boolean;
};

export type AppBooking = {
  id: string;
  status: string;
  coins: number;
  cashKsh?: number;
  scheduledAt: string;
  addons?: string[];
  serviceName: string;
  providerName: string;
  providerSlug: string;
  providerArea: string;
  providerClass?: TierId;
  minutes: number;
  pin?: string | null;
  rated?: boolean;
  freeCancelUntil?: string;
  lateCancel?: boolean;
};

export type CoinTxn = {
  id: number;
  kind: string;
  coins: number;
  note: string | null;
  at: string;
  bookingId: string | null;
};

async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(name as never, args as never);
  if (error) throw new Error(error.message);
  return data as T;
}

export function demoKeyFromSearch(_demo?: string | null): string | null {
  return null;
}

export async function fetchMemberSession(demo?: string | null): Promise<MemberSession | null> {
  const key = demoKeyFromSearch(demo);
  const data = await rpc<MemberSession | null>("member_session", { p_demo: key });
  return data;
}

export async function fetchMemberHome(demo?: string | null) {
  const key = demoKeyFromSearch(demo);
  const data = await rpc<{
    member: MemberSession;
    upcoming: AppBooking[];
    activity: CoinTxn[];
  } | null>("member_home", { p_demo: key });
  return data;
}

export async function fetchMemberBookings(demo: string | null | undefined, tab: string) {
  return rpc<AppBooking[]>("member_bookings", {
    p_demo: demoKeyFromSearch(demo),
    p_tab: tab,
  });
}

export async function fetchBookingDetail(id: string, demo?: string | null) {
  return rpc<AppBooking>("member_booking_detail", {
    p_booking_id: id,
    p_demo: demoKeyFromSearch(demo),
  });
}

export async function fetchMemberWallet(demo?: string | null) {
  return rpc<{
    member: MemberSession;
    spentThisMonth: number;
    toppedUpThisMonth: number;
    ledger: CoinTxn[];
  } | null>("member_wallet", { p_demo: demoKeyFromSearch(demo) });
}

export async function createBooking(args: {
  serviceId: string;
  scheduledAt: string;
  addons?: string[];
  stylist?: string | null;
  demo?: string | null;
  forceSlotTaken?: boolean;
}) {
  return rpc<{
    id: string;
    pin: string;
    coins: number;
    scheduledAt: string;
    serviceName: string;
    providerName: string;
    providerSlug: string;
    stylist: string | null;
    available: number;
    onHold: number;
  }>("member_create_booking", {
    p_service_id: args.serviceId,
    p_scheduled_at: args.scheduledAt,
    p_addons: args.addons ?? [],
    p_stylist: args.stylist ?? null,
    p_demo: demoKeyFromSearch(args.demo),
    p_force_slot_taken: args.forceSlotTaken ?? false,
  });
}

export async function cancelBooking(id: string, demo?: string | null) {
  return rpc<{ id: string; late: boolean; returned: number; toProvider: number }>(
    "member_cancel_booking",
    { p_booking_id: id, p_demo: demoKeyFromSearch(demo) },
  );
}

export async function refreshPin(id: string, demo?: string | null) {
  return rpc<{ pin: string }>("member_refresh_pin", {
    p_booking_id: id,
    p_demo: demoKeyFromSearch(demo),
  });
}

export async function rateBooking(args: {
  id: string;
  rating: number;
  body?: string;
  tags?: string[];
  demo?: string | null;
}) {
  return rpc<{ id: string; rating: number }>("member_rate_booking", {
    p_booking_id: args.id,
    p_rating: args.rating,
    p_body: args.body ?? null,
    p_tags: args.tags ?? [],
    p_demo: demoKeyFromSearch(args.demo),
  });
}

export async function reportProblem(args: {
  id: string;
  reason: string;
  message: string;
  demo?: string | null;
}) {
  return rpc<{ id: string; code: string }>("member_report_problem", {
    p_booking_id: args.id,
    p_reason: args.reason,
    p_message: args.message,
    p_demo: demoKeyFromSearch(args.demo),
  });
}

export async function topUpCoins(args: {
  coins: number;
  method?: string;
  phone?: string;
  demo?: string | null;
}) {
  return rpc<{ coins: number; priceKsh: number; available: number; method: string }>(
    "member_top_up",
    {
      p_coins: args.coins,
      p_method: args.method ?? "mpesa",
      p_phone: args.phone ?? null,
      p_demo: demoKeyFromSearch(args.demo),
    },
  );
}

/** Picks priced at the member's plan rate (not the provider's class). */
export async function fetchPicksForMember(
  memberTier: TierId,
  rules: CoinRules = DEFAULT_RULES,
  limit = 4,
): Promise<ServiceCardData[]> {
  const { data, error } = await supabase
    .from("services")
    .select("id, name, minutes, cash_ksh, image_url, providers!inner(name, slug, area, class)")
    .not("popular_rank", "is", null)
    .order("popular_rank")
    .limit(limit);
  if (error || !data) return [];
  return data.map((row) => {
    const base = toServiceCard(
      row as unknown as {
        id: string;
        name: string;
        minutes: number;
        cash_ksh: number;
        image_url: string | null;
        providers: { name: string; slug: string; area: string; class: TierId };
      },
      rules,
    );
    const providers = (row as unknown as { providers: { class: TierId } }).providers;
    const price = memberPrice(base.cashKsh, memberTier, providers.class, rules);
    if (price.kind === "included") return { ...base, coins: price.coins };
    if (price.kind === "unlock") return { ...base, coins: price.coins };
    return { ...base, coins: base.coins };
  });
}

export async function loadAppExplore(demo: string | null | undefined, q?: string) {
  const [session, rules] = await Promise.all([
    fetchMemberSession(demo),
    fetchRules().catch(() => DEFAULT_RULES),
  ]);
  let query = supabase
    .from("services")
    .select(
      "id, name, minutes, cash_ksh, image_url, category, providers!inner(name, slug, area, class, status)",
    )
    .eq("active", true)
    .eq("providers.status", "live")
    .order("popular_rank", { ascending: true, nullsFirst: false })
    .limit(48);
  if (q?.trim()) query = query.ilike("name", `%${q.trim()}%`);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const tier = session?.tier ?? "intermediate";
  const services = (data ?? []).map((row) => {
    const providers = (
      row as unknown as {
        providers: { name: string; slug: string; area: string; class: TierId };
      }
    ).providers;
    const card = toServiceCard(
      {
        id: row.id,
        name: row.name,
        minutes: row.minutes,
        cash_ksh: row.cash_ksh,
        image_url: row.image_url,
        providers,
      },
      rules,
    );
    const price = memberPrice(card.cashKsh, tier, providers.class, rules);
    return {
      ...card,
      coins: price.kind === "upgrade" ? card.coins : price.coins,
      priceKind: price.kind,
    };
  });
  return { session, rules, services };
}

export type AppProviderPage = {
  session: MemberSession | null;
  rules: CoinRules;
  provider: {
    id: string;
    slug: string;
    name: string;
    area: string;
    about: string | null;
    class: TierId;
    rating: number | null;
    reviewCount: number;
    homeVisits: boolean;
    coverUrl: string | null;
    hours: { days: string; open: string; close: string }[];
  };
  services: {
    id: string;
    name: string;
    minutes: number;
    cashKsh: number;
    category: string;
    coins: number;
    priceKind: "included" | "unlock" | "upgrade";
  }[];
  reviews: {
    authorName: string;
    rating: number;
    body: string | null;
    createdAt: string;
  }[];
  addons: { id: string; label: string; coins: number }[];
};

export async function loadAppProvider(
  slug: string,
  demo?: string | null,
): Promise<AppProviderPage> {
  const [session, rules, providerRes] = await Promise.all([
    fetchMemberSession(demo),
    fetchRules().catch(() => DEFAULT_RULES),
    supabase
      .from("providers")
      .select(
        "id, slug, name, area, about, class, rating, review_count, home_visits, cover_url, hours, services(id, name, minutes, cash_ksh, category, active, sort), reviews(author_name, rating, body, created_at)",
      )
      .eq("slug", slug)
      .eq("status", "live")
      .maybeSingle(),
  ]);
  if (providerRes.error || !providerRes.data) throw new Error("Provider not found");
  const p = providerRes.data;
  const tier = session?.tier ?? "intermediate";
  const services = (p.services ?? [])
    .filter((s: { active: boolean }) => s.active)
    .sort((a: { sort: number }, b: { sort: number }) => a.sort - b.sort)
    .map((s: { id: string; name: string; minutes: number; cash_ksh: number; category: string }) => {
      const price = memberPrice(s.cash_ksh, tier, p.class as TierId, rules);
      return {
        id: s.id,
        name: s.name,
        minutes: s.minutes,
        cashKsh: s.cash_ksh,
        category: s.category,
        coins: price.kind === "upgrade" ? Math.round(s.cash_ksh / rules.kshPerCoin) : price.coins,
        priceKind: price.kind as "included" | "unlock" | "upgrade",
      };
    });
  const { data: addons } = await supabase.from("addons").select("id, label, coins").order("sort");
  return {
    session,
    rules,
    provider: {
      id: p.id,
      slug: p.slug,
      name: p.name,
      area: p.area,
      about: p.about,
      class: p.class as TierId,
      rating: p.rating,
      reviewCount: p.review_count,
      homeVisits: p.home_visits,
      coverUrl: p.cover_url,
      hours: (p.hours as { days: string; open: string; close: string }[]) ?? [],
    },
    services,
    reviews: (
      (p.reviews as {
        author_name: string;
        rating: number;
        body: string | null;
        created_at: string;
      }[]) ?? []
    )
      .slice(0, 6)
      .map((r) => ({
        authorName: r.author_name,
        rating: r.rating,
        body: r.body,
        createdAt: r.created_at,
      })),
    addons: (addons ?? []).map((a) => ({ id: a.id, label: a.label, coins: a.coins })),
  };
}

export function firstName(full: string) {
  return full.split(" ")[0] ?? full;
}

export function formatRenews(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso + (iso.length === 10 ? "T12:00:00" : ""));
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function formatWhen(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  if (sameDay) return `Today · ${time}`;
  return (
    d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) +
    `, ${time}`
  );
}

export function coinsLabel(n: number) {
  return `${num(n)} coins`;
}

export function relativeInHours(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return "Now";
  const hrs = Math.round(ms / 3_600_000);
  if (hrs < 1) return "Soon";
  return `In ${hrs} hr${hrs === 1 ? "" : "s"}`;
}
