import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppServiceCard } from "@/components/app/AppServiceCard";
import { useMember } from "@/components/app/MemberContext";
import { Icon, buttonClass } from "@/components/site/primitives";
import { loadAppExplore } from "@/lib/app-data";
import { DEFAULT_RULES } from "@/lib/pricing";

export const Route = createFileRoute("/app/explore")({
  validateSearch: (raw: Record<string, unknown>) => ({
    demo: typeof raw["demo"] === "string" ? raw["demo"] : undefined,
    q: typeof raw["q"] === "string" ? raw["q"] : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    try {
      return await loadAppExplore(deps.demo ?? null, deps.q);
    } catch {
      return { session: null, rules: DEFAULT_RULES, services: [] };
    }
  },
  component: AppExplore,
});

function AppExplore() {
  const { services } = Route.useLoaderData();
  const search = Route.useSearch();
  const { demo } = useMember();
  const navigate = useNavigate();
  const [q, setQ] = useState(search.q ?? "");

  return (
    <div className="flex flex-col gap-6">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void navigate({
            to: "/app/explore",
            search: { q: q || undefined, ...(demo ? { demo } : {}) } as never,
          });
        }}
      >
        <label className="flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-4 py-3">
          <Icon name="search" size={20} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search braids, Karen, facial…"
            className="w-full bg-transparent type-body-m outline-none"
          />
        </label>
        <button type="submit" className={buttonClass({ size: "s" })}>
          Search
        </button>
      </form>
      <p className="type-body-s text-muted-foreground">
        Prices shown at your plan rate · {services.length} services
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {services.map((s) => (
          <AppServiceCard key={s.id} service={s} />
        ))}
      </div>
    </div>
  );
}
