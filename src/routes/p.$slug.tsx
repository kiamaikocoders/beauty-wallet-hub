import { useEffect, useMemo, useState } from "react";
import { Link, createFileRoute, isNotFound, notFound } from "@tanstack/react-router";
import { SitePage } from "@/components/site/SitePage";
import { Icon, TierBadge, Responsive } from "@/components/site/primitives";
import { BookBar } from "@/components/site/provider/BookBar";
import { BookingCard, type DayOption } from "@/components/site/provider/BookingCard";
import { BookingSheet } from "@/components/site/provider/BookingSheet";
import { ReviewCard } from "@/components/site/provider/ReviewCard";
import { ServiceRow } from "@/components/site/provider/ServiceRow";
import {
  groupServicesBySection,
  loadProviderPage,
  type ProviderProfile,
} from "@/lib/provider-data";
import type { CoinRules } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ProviderSearch = { service?: string };
type ProviderLoaderData = { rules: CoinRules; provider: ProviderProfile };

function validateProviderSearch(raw: Record<string, unknown>): ProviderSearch {
  const service = typeof raw["service"] === "string" ? raw["service"] : undefined;
  return service && UUID_RE.test(service) ? { service } : {};
}

export const Route = createFileRoute("/p/$slug")({
  validateSearch: (search: Record<string, unknown>) => validateProviderSearch(search),
  head: ({ loaderData }) => {
    const p = loaderData as ProviderLoaderData | undefined;
    return {
      meta: [
        {
          title: p?.provider ? `${p.provider.name} — Beauty Wallet` : "Provider — Beauty Wallet",
        },
        {
          name: "description",
          content: p?.provider.about ?? "Book beauty and grooming with Beauty Wallet coins.",
        },
      ],
    };
  },
  loader: async ({ params }): Promise<ProviderLoaderData> => {
    try {
      const data = await loadProviderPage(params.slug);
      if (!data.provider) throw notFound();
      return { rules: data.rules, provider: data.provider };
    } catch (e) {
      if (isNotFound(e)) throw e;
      throw notFound();
    }
  },
  component: ProviderPage,
});

const DESKTOP_TIMES = ["10:00", "11:30", "14:00", "15:30"];
const MOBILE_TIMES = ["10:00", "11:30", "14:00", "15:30", "17:00", "18:00"];

function upcomingDays(count = 5): DayOption[] {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const out: DayOption[] = [];
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    out.push({
      key: iso,
      iso,
      label: labels[d.getDay()]!,
      day: d.getDate(),
    });
  }
  return out;
}

function ProviderPage() {
  const { provider } = Route.useLoaderData() as ProviderLoaderData;
  const search = Route.useSearch();
  const days = useMemo(() => upcomingDays(5), []);
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    search.service ? [search.service] : [],
  );
  const [dateKey, setDateKey] = useState(days[0]?.key ?? "");
  const [time, setTime] = useState("14:00");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState<"services" | "reviews" | "about">("services");
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (search.service) setSelectedIds([search.service]);
  }, [search.service]);

  if (!provider) return null;

  const sections = groupServicesBySection(provider.services);
  const selected = provider.services.find((s) => selectedIds.includes(s.id)) ?? null;
  const day = days.find((d) => d.key === dateKey);

  const joinHref = (() => {
    const params = new URLSearchParams();
    params.set("provider", provider.slug);
    if (selected) params.set("service", selected.id);
    if (dateKey) params.set("date", dateKey);
    if (time) params.set("time", time);
    return `/join?${params.toString()}`;
  })();

  const gallery = buildGallery(provider);

  const toggleService = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id]));
  };

  const formatHours = (h: { days: string; open: string; close: string }) => {
    if (!h.close || h.open === "Closed") return "Closed";
    return `${h.open} – ${h.close}`;
  };

  return (
    <SitePage>
      <section className="w-full">
        <div className="mx-auto w-full max-w-[1440px] px-5 pt-3 lg:px-16 lg:pt-7">
          <nav className="mb-4 hidden type-body-s text-muted-foreground lg:flex lg:gap-2">
            <Link to="/explore" className="text-muted-foreground hover:text-foreground">
              Explore
            </Link>
            <span>/</span>
            <span>{provider.area}</span>
            <span>/</span>
            <span className="text-foreground">{provider.name}</span>
          </nav>

          <div className="relative -mx-5 h-[300px] overflow-hidden lg:mx-0 lg:flex lg:h-[440px] lg:gap-4">
            <img
              src={gallery[0]}
              alt=""
              className="hidden size-full object-cover lg:block lg:flex-1 lg:rounded-xl"
            />
            <div className="hidden w-[420px] shrink-0 flex-col gap-4 lg:flex">
              <img src={gallery[1]} alt="" className="h-[212px] w-full rounded-xl object-cover" />
              <img src={gallery[2]} alt="" className="h-[212px] w-full rounded-xl object-cover" />
            </div>

            <div className="relative h-full w-full lg:hidden">
              <img src={gallery[slide] ?? gallery[0]} alt="" className="size-full object-cover" />
              <div className="absolute bottom-3 right-3 rounded-full bg-foreground/70 px-2.5 py-1">
                <p className="type-caption text-primary-foreground">
                  {slide + 1} / {gallery.length}
                </p>
              </div>
              <button
                type="button"
                aria-label="Previous photo"
                className="absolute inset-y-0 left-0 w-1/3"
                onClick={() => setSlide((s) => (s - 1 + gallery.length) % gallery.length)}
              />
              <button
                type="button"
                aria-label="Next photo"
                className="absolute inset-y-0 right-0 w-1/3"
                onClick={() => setSlide((s) => (s + 1) % gallery.length)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="w-full pb-28 lg:pb-24">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-5 pt-5 lg:flex-row lg:gap-16 lg:px-16 lg:pt-10">
          <div className="flex min-w-0 flex-1 flex-col gap-8 lg:max-w-[828px]">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <TierBadge tier={provider.class} />
                {provider.verified && (
                  <span className="type-caption rounded-full bg-success-bg px-3 py-1.5 text-success">
                    Vetted
                  </span>
                )}
                {provider.homeVisits && (
                  <span className="type-caption rounded-full bg-muted px-3 py-1.5 text-foreground">
                    Home visits
                  </span>
                )}
              </div>
              <h1 className="type-h1 text-foreground lg:type-display-m">{provider.name}</h1>
              <div className="flex flex-wrap items-center gap-1.5">
                <Icon name="star" size={16} />
                <span className="type-body-s-semibold text-foreground">
                  {provider.rating.toFixed(1)}
                </span>
                <span className="type-body-s text-muted-foreground">
                  ({provider.reviewCount} reviews) · {provider.kind} · {provider.area}, Nairobi
                </span>
              </div>
            </div>

            <p className="type-body-m text-muted-foreground lg:type-body-l">{provider.about}</p>
            <div className="hidden h-px w-full bg-border lg:block" />

            <div className="flex border-b border-border lg:hidden">
              {(
                [
                  ["services", "Services"],
                  ["reviews", "Reviews"],
                  ["about", "About"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    "type-body-s-medium relative flex h-12 flex-1 items-center justify-center",
                    tab === id ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                  {tab === id && (
                    <span className="absolute inset-x-[22%] bottom-0 h-0.5 bg-foreground" />
                  )}
                </button>
              ))}
            </div>

            <div className={cn("flex flex-col gap-3", tab !== "services" && "hidden lg:flex")}>
              <h2 className="hidden type-h2 text-foreground lg:block">Services</h2>
              {sections.map(([section, services]) => (
                <div key={section} className="flex flex-col">
                  <p className="type-eyebrow text-burgundy">{section}</p>
                  {services.map((s) => (
                    <ServiceRow
                      key={s.id}
                      service={s}
                      selected={selectedIds.includes(s.id)}
                      onToggle={() => toggleService(s.id)}
                    />
                  ))}
                </div>
              ))}
            </div>

            <div className={cn("flex flex-col gap-3", tab !== "reviews" && "max-lg:hidden")}>
              <h2 className="type-h2 text-foreground">Reviews</h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {provider.reviews.map((r) => (
                  <ReviewCard key={`${r.authorName}-${r.createdAt}`} review={r} />
                ))}
              </div>
            </div>

            <div className={cn("flex flex-col gap-3", tab !== "about" && "max-lg:hidden")}>
              <h2 className="type-h2 text-foreground">Hours and location</h2>
              <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
                <div className="flex w-full max-w-[300px] flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    {provider.hours.map((h) => (
                      <div key={h.days} className="type-body-s flex justify-between gap-4">
                        <span className="text-foreground">{h.days}</span>
                        <span className="whitespace-nowrap text-muted-foreground">
                          {formatHours(h)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="type-body-s text-muted-foreground">
                    <Responsive
                      mobile="Exact directions are shared after you book."
                      desktop={`${provider.area}, Nairobi. Exact directions are shared after you book.`}
                    />
                  </p>
                </div>
                <div className="relative h-[180px] flex-1 overflow-hidden rounded-xl bg-muted lg:h-[220px]">
                  <MapIllustration />
                  <div className="absolute left-1/2 top-[40%] -translate-x-1/2">
                    <Icon name="map-pin" size={36} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden w-full max-w-[420px] shrink-0 lg:block">
            <BookingCard
              selected={selected}
              days={days}
              times={DESKTOP_TIMES}
              dateKey={dateKey}
              time={time}
              onDate={setDateKey}
              onTime={setTime}
              joinHref={joinHref}
            />
          </div>
        </div>
      </section>

      <BookBar selected={selected} day={day} time={time} onOpenSheet={() => setSheetOpen(true)} />
      <BookingSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        selected={selected}
        days={days}
        times={MOBILE_TIMES}
        dateKey={dateKey}
        time={time}
        onDate={setDateKey}
        onTime={setTime}
        joinHref={joinHref}
      />
    </SitePage>
  );
}

function buildGallery(provider: ProviderProfile) {
  const cover =
    provider.coverUrl ||
    (provider.slug === "the-karen-retreat" ? "/images/provider/karen-cover.jpg" : null);
  const sideA =
    provider.services.find((s) => s.section === "Facials" && s.imageUrl)?.imageUrl ||
    (provider.slug === "the-karen-retreat" ? "/images/provider/karen-facial.jpg" : null) ||
    provider.services.find((s) => s.imageUrl)?.imageUrl;
  const sideB =
    provider.services.find((s) => s.section === "Massage" && s.imageUrl)?.imageUrl ||
    (provider.slug === "the-karen-retreat" ? "/images/provider/karen-massage.jpg" : null) ||
    provider.services.filter((s) => s.imageUrl && s.imageUrl !== sideA).at(0)?.imageUrl;
  const gallery = [cover, sideA, sideB].filter((u): u is string => !!u);
  const extras = provider.services
    .map((s) => s.imageUrl)
    .filter((u): u is string => !!u && !gallery.includes(u));
  const all = [...gallery, ...extras];
  while (all.length < 3 && all[0]) all.push(all[0]);
  return all.length ? all : ["/images/provider/karen-cover.jpg"];
}

function MapIllustration() {
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 496 220" fill="none" aria-hidden>
      <rect width="496" height="220" className="fill-muted" />
      <path d="M0 120 H496" stroke="currentColor" className="text-border" strokeWidth="14" />
      <path d="M140 -10 V230" stroke="currentColor" className="text-border" strokeWidth="18" />
      <path d="M320 -10 V230" stroke="currentColor" className="text-border" strokeWidth="10" />
      <path d="M360 40 H520" stroke="currentColor" className="text-border" strokeWidth="12" />
      <path
        d="M20 20 H180 V110 H20 Z"
        stroke="currentColor"
        className="text-border"
        strokeWidth="8"
        fill="none"
      />
    </svg>
  );
}
