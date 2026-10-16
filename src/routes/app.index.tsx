import { Link, createFileRoute } from "@tanstack/react-router";
import { WalletCard } from "@/components/site/cards";
import { buttonClass, Icon } from "@/components/site/primitives";
import { AppServiceCard } from "@/components/app/AppServiceCard";
import { useMember } from "@/components/app/MemberContext";
import {
  coinsLabel,
  fetchMemberHome,
  fetchPicksForMember,
  firstName,
  formatRenews,
  formatWhen,
  greeting,
  relativeInHours,
} from "@/lib/app-data";
import { fetchRules } from "@/lib/catalog";
import { DEFAULT_RULES, ksh, num } from "@/lib/pricing";

export const Route = createFileRoute("/app/")({
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const demo = typeof deps.demo === "string" ? deps.demo : null;
    try {
      const [home, rules] = await Promise.all([
        fetchMemberHome(demo),
        fetchRules().catch(() => DEFAULT_RULES),
      ]);
      const picks = home?.member ? await fetchPicksForMember(home.member.tier, rules, 4) : [];
      return { home, rules, picks };
    } catch {
      return { home: null, rules: DEFAULT_RULES, picks: [] };
    }
  },
  component: AppHome,
});

function AppHome() {
  const { home, rules, picks } = Route.useLoaderData();
  const { member, demo } = useMember();
  if (!member || !home) return null;
  const upcoming = home.upcoming?.[0];
  const search = demo ? { demo } : {};

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h2 className="type-h2 lg:type-h1">
          {greeting()}, {firstName(member.fullName)}
        </h2>
        <p className="mt-2 max-w-xl type-body-m text-muted-foreground">
          {upcoming
            ? `You have one visit today and ${num(member.wallet.available)} coins to spend before ${formatRenews(member.renewsOn)}.`
            : `You have ${num(member.wallet.available)} coins to spend before ${formatRenews(member.renewsOn)}.`}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <WalletCard
          tier={member.tier}
          coins={num(member.wallet.available)}
          value={`≈ ${ksh(member.wallet.available * rules.kshPerCoin)} in service value`}
          onHold={coinsLabel(member.wallet.onHold)}
          rollover={coinsLabel(Math.round(member.wallet.available * rules.rolloverPct))}
          rolloverLabel={`Rolls over (${Math.round(rules.rolloverPct * 100)}%)`}
          renews={formatRenews(member.renewsOn)}
          className="lg:col-span-1"
        />
        {upcoming ? (
          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 lg:col-span-1">
            <div>
              <div className="flex items-center justify-between type-caption text-muted-foreground">
                <span>{formatWhen(upcoming.scheduledAt)}</span>
                <span>{relativeInHours(upcoming.scheduledAt)}</span>
              </div>
              <h3 className="mt-6 type-h3">{upcoming.serviceName}</h3>
              <p className="mt-2 type-body-s text-muted-foreground">
                {upcoming.providerName} · {upcoming.providerArea} · {upcoming.coins} coins on hold
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                to="/app/bookings/$id"
                params={{ id: upcoming.id }}
                search={search as never}
                className={buttonClass({ size: "s" })}
              >
                Show arrival pass
              </Link>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(upcoming.providerName + " " + upcoming.providerArea)}`}
                className={buttonClass({ size: "s", variant: "secondary" })}
              >
                Directions
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-center rounded-xl border border-dashed border-border bg-card p-5 lg:col-span-1">
            <p className="type-h3">No visit today</p>
            <Link
              to="/app/explore"
              search={search as never}
              className={buttonClass({ size: "s", className: "mt-4 w-fit" })}
            >
              Explore services
            </Link>
          </div>
        )}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="type-h4">Recent activity</h3>
            <Link to="/app/wallet" search={search as never} className="type-body-s text-burgundy">
              Wallet
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-border">
            {(home.activity ?? []).slice(0, 3).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate type-body-s-semibold">{a.note ?? a.kind}</p>
                  <p className="type-caption text-muted-foreground">
                    {a.kind} ·{" "}
                    {new Date(a.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <p className="shrink-0 type-body-s-semibold">
                  {a.coins > 0
                    ? `+${a.coins}`
                    : a.kind === "hold"
                      ? `${Math.abs(a.coins)} held`
                      : String(a.coins)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:hidden">
        <Link
          to="/app/explore"
          search={search as never}
          className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
        >
          <Icon name="search" size={22} />
          <span className="type-body-s-semibold">Book</span>
        </Link>
        <Link
          to="/app/wallet/top-up"
          search={search as never}
          className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
        >
          <Icon name="plus" size={22} />
          <span className="type-body-s-semibold">Top up</span>
        </Link>
        <Link
          to="/app/plan"
          search={search as never}
          className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
        >
          <Icon name="layers" size={22} />
          <span className="type-body-s-semibold">Plan</span>
        </Link>
        {upcoming ? (
          <Link
            to="/app/bookings/$id"
            params={{ id: upcoming.id }}
            search={search as never}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
          >
            <Icon name="qr-code" size={22} />
            <span className="type-body-s-semibold">My PIN</span>
          </Link>
        ) : (
          <Link
            to="/app/bookings"
            search={search as never}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
          >
            <Icon name="qr-code" size={22} />
            <span className="type-body-s-semibold">My PIN</span>
          </Link>
        )}
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h3 className="type-h3">Picked for you</h3>
          <Link to="/app/explore" search={search as never} className="type-body-s text-burgundy">
            See all
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {picks.map((s) => (
            <AppServiceCard key={s.id} service={s} />
          ))}
        </div>
      </section>
    </div>
  );
}
