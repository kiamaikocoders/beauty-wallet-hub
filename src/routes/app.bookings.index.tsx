import { Link, createFileRoute } from "@tanstack/react-router";
import { useMember } from "@/components/app/MemberContext";
import { MomentLottie } from "@/components/site/MomentLottie";
import { buttonClass } from "@/components/site/primitives";
import { fetchMemberBookings, formatWhen } from "@/lib/app-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/bookings/")({
  validateSearch: (raw: Record<string, unknown>) => ({
    demo: typeof raw["demo"] === "string" ? raw["demo"] : undefined,
    tab: typeof raw["tab"] === "string" ? raw["tab"] : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const tab = deps.tab === "past" || deps.tab === "cancelled" ? deps.tab : "upcoming";
    const rows = await fetchMemberBookings(deps.demo ?? null, tab).catch(() => []);
    return { tab, rows };
  },
  component: BookingsList,
});

function BookingsList() {
  const { tab, rows } = Route.useLoaderData();
  const { demo } = useMember();
  const searchBase = demo ? { demo } : {};

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-muted p-1">
          {(["upcoming", "past", "cancelled"] as const).map((t) => (
            <Link
              key={t}
              to="/app/bookings"
              search={{ ...searchBase, tab: t === "upcoming" ? undefined : t } as never}
              className={cn(
                "rounded-full px-4 py-2 type-body-s-semibold capitalize",
                tab === t ? "bg-card text-foreground shadow-soft" : "text-muted-foreground",
              )}
            >
              {t}
              {t === "upcoming" ? ` (${rows.length})` : ""}
            </Link>
          ))}
        </div>
        <Link to="/app/explore" search={searchBase as never} className={buttonClass({ size: "s" })}>
          Book a service
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <MomentLottie name="calendar" size={72} />
          <h2 className="mt-4 type-h2">
            {tab === "past"
              ? "No past visits"
              : tab === "cancelled"
                ? "No cancelled visits"
                : "No upcoming visits"}
          </h2>
          <p className="mx-auto mt-2 max-w-md type-body-m text-muted-foreground">
            Your coins are ready. Book a visit and it shows up here with your arrival PIN.
          </p>
          <Link
            to="/app/explore"
            search={searchBase as never}
            className={buttonClass({ className: "mt-6" })}
          >
            Explore services
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((b) => {
            const d = new Date(b.scheduledAt);
            return (
              <li key={b.id}>
                <Link
                  to="/app/bookings/$id"
                  params={{ id: b.id }}
                  search={searchBase as never}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex size-14 flex-col items-center justify-center rounded-lg bg-muted text-center">
                    <span className="type-caption uppercase">
                      {d.toLocaleDateString("en-GB", { weekday: "short" })}
                    </span>
                    <span className="type-h4">{d.getDate()}</span>
                    <span className="type-caption">
                      {d.toLocaleDateString("en-GB", { month: "short" })}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="type-body-m-medium">{b.serviceName}</p>
                    <p className="type-body-s text-muted-foreground">
                      {b.providerName} · {formatWhen(b.scheduledAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="type-body-s-semibold">
                      {b.status === "done" ? `${b.coins} coins` : `${b.coins} held`}
                    </p>
                    <p className="type-caption capitalize text-muted-foreground">{b.status}</p>
                    {b.status === "done" && !b.rated && (
                      <span className="type-caption text-burgundy">Rate visit</span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
