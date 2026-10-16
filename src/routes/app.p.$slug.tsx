import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMember } from "@/components/app/MemberContext";
import { NotEnoughCoinsSheet } from "@/components/app/Sheets";
import { TierBadge, buttonClass, tierName } from "@/components/site/primitives";
import { loadAppProvider } from "@/lib/app-data";
import { duration, ksh, num } from "@/lib/pricing";

export const Route = createFileRoute("/app/p/$slug")({
  validateSearch: (raw: Record<string, unknown>) => ({
    demo: typeof raw["demo"] === "string" ? raw["demo"] : undefined,
    service: typeof raw["service"] === "string" ? raw["service"] : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ params, deps }) => loadAppProvider(params.slug, deps.demo ?? null),
  component: AppProvider,
});

function AppProvider() {
  const data = Route.useLoaderData();
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const { member, demo } = useMember();
  const [selected, setSelected] = useState(search.service ?? data.services[0]?.id);
  const [notEnough, setNotEnough] = useState(false);
  const svc = data.services.find((s) => s.id === selected) ?? data.services[0];
  const unlock = svc?.priceKind === "unlock";
  const upgrade = svc?.priceKind === "upgrade";
  const unlockFee = unlock && svc ? Math.round(svc.coins - svc.coins / 1.1) : 0;
  const baseCoins = unlock && svc ? svc.coins - unlockFee : (svc?.coins ?? 0);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
      <div className="min-w-0 flex-1">
        <Link
          to="/app/explore"
          search={(demo ? { demo } : {}) as never}
          className="type-body-s text-burgundy"
        >
          ← Back to results
        </Link>
        <div className="mt-4 overflow-hidden rounded-xl bg-muted">
          {data.provider.coverUrl ? (
            <img src={data.provider.coverUrl} alt="" className="h-48 w-full object-cover lg:h-64" />
          ) : (
            <div className="h-48 lg:h-64" />
          )}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <TierBadge tier={data.provider.class} />
          <h1 className="type-h1">{data.provider.name}</h1>
        </div>
        <p className="mt-2 type-body-m text-muted-foreground">
          {data.provider.area}
          {data.provider.hours[0]
            ? ` · open today ${data.provider.hours[0].open} to ${data.provider.hours[0].close}`
            : ""}
          {data.provider.rating != null ? ` · ★ ${data.provider.rating}` : ""}
        </p>
        {unlock || upgrade ? (
          <p className="mt-4 rounded-xl border border-rose bg-blush-subtle p-4 type-body-s">
            This studio is on the {tierName[data.provider.class]} plan.{" "}
            {upgrade
              ? "Upgrade to Premium to book here."
              : "As a Basic member you can still book it by adding an unlock fee in coins."}
          </p>
        ) : null}
        {data.provider.about && <p className="mt-4 type-body-m">{data.provider.about}</p>}

        <h2 className="mt-8 type-h3">Services</h2>
        <p className="type-caption text-muted-foreground">
          Coins at your {member ? tierName[member.tier] : ""} rate
        </p>
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
          {data.services.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setSelected(s.id)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-4 text-left ${selected === s.id ? "bg-blush-subtle" : ""}`}
              >
                <span>
                  <span className="block type-body-m-medium">{s.name}</span>
                  <span className="type-caption text-muted-foreground">
                    {duration(s.minutes)} · {ksh(s.cashKsh)}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block type-body-s-semibold">{num(s.coins)} coins</span>
                  {s.priceKind === "unlock" && (
                    <span className="type-caption text-burgundy">+ unlock</span>
                  )}
                  {s.priceKind === "upgrade" && (
                    <span className="type-caption text-burgundy">Upgrade</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {data.reviews.length > 0 && (
          <section className="mt-8">
            <h2 className="type-h3">Reviews</h2>
            <ul className="mt-4 space-y-3">
              {data.reviews.map((r, i) => (
                <li key={i} className="rounded-xl border border-border bg-card p-4">
                  <p className="type-body-s-semibold">
                    {"★".repeat(r.rating)} {r.authorName}
                  </p>
                  {r.body && <p className="mt-1 type-body-s text-muted-foreground">{r.body}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <aside className="w-full shrink-0 lg:sticky lg:top-28 lg:w-[360px]">
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          {svc && (
            <>
              <p className="type-eyebrow text-burgundy">
                {unlock ? "Unlock this visit" : upgrade ? "Upgrade required" : "Book"}
              </p>
              <h3 className="mt-2 type-h3">{svc.name}</h3>
              {unlock && (
                <div className="mt-4 space-y-2 type-body-s">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service at Basic rate</span>
                    <span>{baseCoins} coins</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unlock fee (10%)</span>
                    <span>{unlockFee} coins</span>
                  </div>
                  <div className="flex justify-between type-body-s-semibold">
                    <span>Total</span>
                    <span>{svc.coins}</span>
                  </div>
                </div>
              )}
              {!unlock && !upgrade && <p className="mt-3 type-h2">{num(svc.coins)} coins</p>}
              {upgrade ? (
                <Link
                  to="/app/plan"
                  search={(demo ? { demo } : {}) as never}
                  className={buttonClass({ full: true, className: "mt-5" })}
                >
                  Upgrade to Premium
                </Link>
              ) : (
                <Link
                  to="/app/book"
                  search={
                    {
                      provider: slug,
                      service: svc.id,
                      ...(demo ? { demo } : {}),
                    } as never
                  }
                  onClick={(e) => {
                    if (member && member.wallet.available < svc.coins) {
                      e.preventDefault();
                      setNotEnough(true);
                    }
                  }}
                  className={buttonClass({
                    full: true,
                    className: "mt-5",
                    variant: unlock ? "emphasis" : "primary",
                  })}
                >
                  {unlock ? "Unlock and choose a time" : "Choose a time"}
                </Link>
              )}
            </>
          )}
        </div>
      </aside>

      {svc && member && (
        <NotEnoughCoinsSheet
          open={notEnough}
          onClose={() => setNotEnough(false)}
          serviceName={svc.name}
          providerName={data.provider.name}
          minutes={svc.minutes}
          baseCoins={baseCoins}
          unlockCoins={unlockFee}
          available={member.wallet.available}
          demo={demo}
        />
      )}
    </div>
  );
}
