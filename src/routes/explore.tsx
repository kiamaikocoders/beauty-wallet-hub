import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ServiceCard } from "@/components/site/cards";
import { FiltersSheet } from "@/components/site/explore/FiltersSheet";
import { SitePage } from "@/components/site/SitePage";
import { Icon, buttonClass, tierName } from "@/components/site/primitives";
import {
  AREAS,
  SORT_LABELS,
  loadExplorePage,
  type ExploreFilters,
  type ExploreSort,
} from "@/lib/explore-data";
import { DEFAULT_RULES, TIER_ORDER, type TierId } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const TIERS = new Set<TierId>(["basic", "intermediate", "premium"]);
const SORTS = new Set<ExploreSort>(["recommended", "price-asc", "price-desc", "duration"]);

function asString(v: unknown) {
  return typeof v === "string" && v.length ? v : undefined;
}
function asBool(v: unknown) {
  if (v === true || v === "true" || v === "1") return true;
  if (v === false || v === "false" || v === "0") return false;
  return undefined;
}
function asNumber(v: unknown) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function validateExploreSearch(raw: Record<string, unknown>): ExploreFilters {
  const out: ExploreFilters = {};
  const q = asString(raw["q"]);
  const area = asString(raw["area"]);
  const category = asString(raw["category"]);
  const tier = asString(raw["tier"]);
  const sort = asString(raw["sort"]);
  const date = asString(raw["date"]);
  const home = asBool(raw["home"]);
  const coinsMin = asNumber(raw["coinsMin"]);
  const coinsMax = asNumber(raw["coinsMax"]);
  const today = asBool(raw["today"]);
  const before8 = asBool(raw["before8"]);
  if (q) out.q = q;
  if (area) out.area = area;
  if (category) out.category = category;
  if (tier && TIERS.has(tier as TierId)) out.tier = tier as TierId;
  if (sort && SORTS.has(sort as ExploreSort)) out.sort = sort as ExploreSort;
  if (date) out.date = date;
  if (home !== undefined) out.home = home;
  if (coinsMin !== undefined) out.coinsMin = coinsMin;
  if (coinsMax !== undefined) out.coinsMax = coinsMax;
  if (today !== undefined) out.today = today;
  if (before8 !== undefined) out.before8 = before8;
  return out;
}

export const Route = createFileRoute("/explore")({
  validateSearch: (search: Record<string, unknown>) => validateExploreSearch(search),
  head: () => ({
    meta: [
      { title: "Explore — Beauty Wallet" },
      {
        name: "description",
        content: "Beauty and grooming services in Nairobi. Book with coins at vetted providers.",
      },
    ],
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    try {
      return await loadExplorePage(deps as ExploreFilters);
    } catch {
      return {
        rules: DEFAULT_RULES,
        categories: [],
        serviceCount: 0,
        providerCount: 0,
        services: [],
      };
    }
  },
  component: ExplorePage,
});

const PAGE_SIZE = 8;

function ExplorePage() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/explore" });
  const [draftQ, setDraftQ] = useState(search.q ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filters = search as ExploreFilters;
  const sort = (filters.sort ?? "recommended") as ExploreSort;
  const shown = data.services.slice(0, visible);
  const hasMore = visible < data.services.length;

  const setSearch = (patch: Record<string, string | number | boolean | undefined>) => {
    setVisible(PAGE_SIZE);
    void navigate({
      search: (prev) => {
        const next: Record<string, unknown> = { ...prev, ...patch };
        for (const key of Object.keys(next)) {
          const v = next[key];
          if (v === undefined || v === "" || v === false) delete next[key];
        }
        return next as typeof prev;
      },
      replace: true,
    });
  };

  const areaLabel = filters.area ?? "All of Nairobi";
  const dateLabel = filters.date ?? "Any date";

  const countLabel = useMemo(() => {
    const n = data.services.length;
    return {
      desktop: `${n} services · ${data.providerCount} vetted providers`,
      mobile: `${n} services`,
    };
  }, [data.services.length, data.providerCount]);

  return (
    <SitePage>
      <section className="w-full border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-5 pb-6 pt-3 lg:gap-7 lg:px-16 lg:pb-8 lg:pt-12">
          <div className="hidden items-end gap-6 lg:flex">
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <p className="type-eyebrow text-burgundy">Explore</p>
              <h1 className="type-h1 text-foreground">Beauty and grooming services in Nairobi</h1>
            </div>
            <p className="type-body-s shrink-0 whitespace-nowrap text-muted-foreground">
              {countLabel.desktop}
            </p>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            <label className="relative flex h-[52px] min-w-0 flex-1 items-center gap-2.5 rounded-full border border-foreground bg-white px-[18px]">
              <Icon name="search" />
              <input
                type="search"
                value={draftQ}
                onChange={(e) => setDraftQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setSearch({ q: draftQ || undefined });
                }}
                placeholder="Search services or salons"
                className="type-body-m min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
              />
            </label>

            <div className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setAreaOpen((o) => !o)}
                className="type-body-m flex h-[52px] w-[240px] items-center gap-2.5 rounded-full border border-foreground bg-white px-[18px] text-left text-muted-foreground"
              >
                <Icon name="map-pin" />
                <span className="min-w-0 flex-1 truncate text-foreground">{areaLabel}</span>
                <Icon name="chevron-down" />
              </button>
              {areaOpen && (
                <div className="absolute left-0 top-[56px] z-20 w-full rounded-xl border border-border bg-card p-2 shadow-raised">
                  <button
                    type="button"
                    className="type-body-s block w-full rounded-md px-3 py-2.5 text-left hover:bg-muted"
                    onClick={() => {
                      setSearch({ area: undefined });
                      setAreaOpen(false);
                    }}
                  >
                    All of Nairobi
                  </button>
                  {AREAS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      className="type-body-s block w-full rounded-md px-3 py-2.5 text-left hover:bg-muted"
                      onClick={() => {
                        setSearch({ area: a });
                        setAreaOpen(false);
                      }}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="type-body-m hidden h-[52px] w-[200px] items-center gap-2.5 rounded-full border border-foreground bg-white px-[18px] text-left text-muted-foreground lg:flex">
              <Icon name="calendar" />
              <span className="min-w-0 flex-1 truncate text-foreground">{dateLabel}</span>
              <Icon name="chevron-down" />
            </div>

            <button
              type="button"
              className={buttonClass({
                variant: "emphasis",
                className: "hidden lg:inline-flex",
              })}
              onClick={() => setSearch({ q: draftQ || undefined })}
            >
              Search
            </button>

            <button
              type="button"
              aria-label="Open filters"
              onClick={() => setFiltersOpen(true)}
              className="flex size-[52px] shrink-0 items-center justify-center rounded-full border border-foreground bg-white lg:hidden"
            >
              <Icon name="layers" />
            </button>
          </div>

          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
            <CategoryChip
              active={!filters.category}
              onClick={() => setSearch({ category: undefined })}
            >
              All
            </CategoryChip>
            {data.categories.map((c) => (
              <CategoryChip
                key={c.slug}
                active={filters.category === c.slug}
                onClick={() => setSearch({ category: c.slug })}
              >
                {c.name}
              </CategoryChip>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-5 pb-16 pt-5 lg:gap-6 lg:px-16 lg:pb-24 lg:pt-10">
          <div className="hidden items-center lg:flex">
            <div className="flex items-center gap-2">
              <p className="type-body-s-medium text-muted-foreground">Provider tier</p>
              <TierChip
                active={!filters.tier}
                onClick={() => setSearch({ tier: undefined })}
                label="All tiers"
              />
              {TIER_ORDER.map((t) => (
                <TierChip
                  key={t}
                  active={filters.tier === t}
                  onClick={() => setSearch({ tier: t })}
                  label={tierName[t]}
                />
              ))}
            </div>
            <div className="mx-4 h-px flex-1 bg-border" />
            <SortControl
              sort={sort}
              open={sortOpen}
              onToggle={() => setSortOpen((o) => !o)}
              onPick={(s) => {
                setSearch({ sort: s === "recommended" ? undefined : s });
                setSortOpen(false);
              }}
              prefix="Sort: "
            />
          </div>

          <div className="flex items-center justify-between lg:hidden">
            <p className="type-body-s text-muted-foreground">{countLabel.mobile}</p>
            <SortControl
              sort={sort}
              open={sortOpen}
              onToggle={() => setSortOpen((o) => !o)}
              onPick={(s) => {
                setSearch({ sort: s === "recommended" ? undefined : s });
                setSortOpen(false);
              }}
            />
          </div>

          <p className="hidden type-body-s text-muted-foreground lg:block">
            Coin prices shown for each service’s tier. Members on a lower tier can unlock it with
            extra coins.
          </p>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {shown.map((service) => (
              <ServiceCard key={service.id} service={service} className="w-full" />
            ))}
          </div>

          {data.services.length === 0 && (
            <p className="type-body-m text-muted-foreground">
              No services match these filters. Try clearing a filter or searching something else.
            </p>
          )}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                className={buttonClass({
                  variant: "secondary",
                  className: "w-full lg:w-auto",
                })}
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
              >
                Show more services
              </button>
            </div>
          )}
        </div>
      </section>

      <FiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        resultCount={data.services.length}
        onApply={setSearch}
      />
    </SitePage>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "type-body-s-medium inline-flex h-11 shrink-0 items-center rounded-full px-4 lg:h-10",
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-white text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function TierChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "type-body-s-medium inline-flex h-9 items-center rounded-full px-4",
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-white text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function SortControl({
  sort,
  open,
  onToggle,
  onPick,
  prefix = "",
}: {
  sort: ExploreSort;
  open: boolean;
  onToggle: () => void;
  onPick: (s: ExploreSort) => void;
  prefix?: string;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="type-body-s-medium flex items-center gap-1.5 text-foreground"
      >
        {prefix}
        {SORT_LABELS[sort]}
        <Icon name="chevron-down" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-52 rounded-xl border border-border bg-card p-2 shadow-raised">
          {(Object.keys(SORT_LABELS) as ExploreSort[]).map((s) => (
            <button
              key={s}
              type="button"
              className="type-body-s block w-full rounded-md px-3 py-2.5 text-left hover:bg-muted"
              onClick={() => onPick(s)}
            >
              {SORT_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
