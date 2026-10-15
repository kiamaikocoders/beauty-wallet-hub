import { supabase } from "@/integrations/supabase/client";
import { fetchRules } from "@/lib/catalog";
import { serviceCoins, type CoinRules, type TierId } from "@/lib/pricing";

export type ProviderHour = { days: string; open: string; close: string };

export type ProviderService = {
  id: string;
  name: string;
  section: string;
  category: string;
  cashKsh: number;
  minutes: number;
  coins: number;
  imageUrl: string | null;
  sort: number;
};

export type ProviderReview = {
  authorName: string;
  authorTier: TierId | null;
  rating: number;
  body: string;
  createdAt: string;
};

export type ProviderProfile = {
  id: string;
  slug: string;
  name: string;
  area: string;
  kind: string;
  about: string;
  class: TierId;
  verified: boolean;
  homeVisits: boolean;
  rating: number;
  reviewCount: number;
  coverUrl: string | null;
  photoUrl: string | null;
  hours: ProviderHour[];
  services: ProviderService[];
  reviews: ProviderReview[];
};

type ProviderRow = {
  id: string;
  slug: string;
  name: string;
  area: string;
  kind: string;
  about: string;
  class: TierId;
  verified: boolean;
  home_visits: boolean;
  rating: number | string;
  review_count: number;
  cover_url: string | null;
  photo_url: string | null;
  hours: ProviderHour[] | null;
  status: string;
};

type ServiceRow = {
  id: string;
  name: string;
  section: string;
  category: string;
  cash_ksh: number;
  minutes: number;
  image_url: string | null;
  sort: number;
};

type ReviewRow = {
  author_name: string;
  author_tier: TierId | null;
  rating: number;
  body: string | null;
  created_at: string;
};

export async function fetchProviderBySlug(
  slug: string,
  rules: CoinRules,
): Promise<ProviderProfile | null> {
  const { data, error } = await supabase
    .from("providers")
    .select(
      "id, slug, name, area, kind, about, class, verified, home_visits, rating, review_count, cover_url, photo_url, hours, status",
    )
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();

  if (error) throw new Error(error.message);
  const provider = data as unknown as ProviderRow | null;
  if (!provider) return null;

  const [servicesRes, reviewsRes] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, section, category, cash_ksh, minutes, image_url, sort")
      .eq("provider_id", provider.id)
      .eq("active", true)
      .order("sort"),
    supabase
      .from("reviews")
      .select("author_name, author_tier, rating, body, created_at")
      .eq("provider_id", provider.id)
      .order("created_at", { ascending: false }),
  ]);

  if (servicesRes.error) throw new Error(servicesRes.error.message);
  if (reviewsRes.error) throw new Error(reviewsRes.error.message);

  const services = servicesRes.data as unknown as ServiceRow[];
  const reviews = reviewsRes.data as unknown as ReviewRow[];
  const tier = provider.class;

  return {
    id: provider.id,
    slug: provider.slug,
    name: provider.name,
    area: provider.area,
    kind: provider.kind,
    about: provider.about,
    class: tier,
    verified: provider.verified,
    homeVisits: provider.home_visits,
    rating: Number(provider.rating),
    reviewCount: provider.review_count,
    coverUrl: provider.cover_url,
    photoUrl: provider.photo_url,
    hours: provider.hours ?? [],
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      section: s.section,
      category: s.category,
      cashKsh: s.cash_ksh,
      minutes: s.minutes,
      coins: serviceCoins(s.cash_ksh, tier, rules),
      imageUrl: s.image_url,
      sort: s.sort,
    })),
    reviews: reviews.map((r) => ({
      authorName: r.author_name,
      authorTier: r.author_tier,
      rating: r.rating,
      body: r.body ?? "",
      createdAt: r.created_at,
    })),
  };
}

export async function loadProviderPage(slug: string) {
  const rules = await fetchRules();
  const provider = await fetchProviderBySlug(slug, rules);
  return { rules, provider };
}

export function initials(name: string) {
  const parts = name.replace(/\./g, "").split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function reviewMeta(tier: TierId | null, createdAt: string) {
  const month = new Date(createdAt).toLocaleString("en-US", { month: "short", year: "numeric" });
  const tierLabel = tier ? `${tier.charAt(0).toUpperCase()}${tier.slice(1)} member` : "Member";
  return `${tierLabel} · ${month}`;
}

export function groupServicesBySection(services: ProviderService[]) {
  const map = new Map<string, ProviderService[]>();
  for (const s of services) {
    const list = map.get(s.section) ?? [];
    list.push(s);
    map.set(s.section, list);
  }
  return [...map.entries()];
}
