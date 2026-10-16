import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SlotTakenSheet } from "@/components/app/Sheets";
import { useMember } from "@/components/app/MemberContext";
import { buttonClass } from "@/components/site/primitives";
import { loadAppProvider } from "@/lib/app-data";
import { duration, num } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/book/")({
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    if (!deps.provider) return null;
    return loadAppProvider(deps.provider, deps.demo ?? null);
  },
  component: BookTime,
});

const TIMES = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00"];
const STYLISTS = ["Any stylist", "Wanjiku", "Njeri"];

function BookTime() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const { demo } = useMember();
  const navigate = useNavigate();
  const svc = data?.services.find((s) => s.id === search.service) ?? data?.services[0];
  const days = useMemo(() => {
    const out: { label: string; day: string; date: Date; full?: boolean }[] = [];
    const start = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      out.push({
        label: d.toLocaleDateString("en-GB", { weekday: "short" }),
        day: String(d.getDate()),
        date: d,
        full: i === 2,
      });
    }
    return out;
  }, []);
  const [dayIdx, setDayIdx] = useState(5);
  const [time, setTime] = useState("10:00");
  const [stylist, setStylist] = useState("Wanjiku");
  const [addons, setAddons] = useState<string[]>([]);
  const [slotTaken, setSlotTaken] = useState(false);

  if (!data || !svc) {
    return (
      <p className="type-body-m">
        Pick a service first.{" "}
        <Link to="/app/explore" search={(demo ? { demo } : {}) as never} className="text-burgundy">
          Explore
        </Link>
      </p>
    );
  }

  const addonCoins = data.addons
    .filter((a) => addons.includes(a.id))
    .reduce((t, a) => t + a.coins, 0);
  const total = svc.coins + addonCoins;
  const whenIso = () => {
    const d = new Date(days[dayIdx]!.date);
    const [hh, mm] = time.split(":").map(Number);
    d.setHours(hh!, mm!, 0, 0);
    return d.toISOString();
  };
  const whenLabel = `${days[dayIdx]!.label} ${days[dayIdx]!.day} · ${time}`;

  const goReview = (iso?: string) => {
    void navigate({
      to: "/app/book/review",
      search: {
        provider: data.provider.slug,
        service: svc.id,
        when: iso ?? whenIso(),
        stylist,
        addons: addons.join(","),
        ...(demo ? { demo } : {}),
      } as never,
    });
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        <h2 className="type-h2">Choose a time</h2>
        <div className="mt-5 flex items-center justify-between">
          <p className="type-body-s-semibold">
            {days[0]!.date.toLocaleDateString("en-GB", { month: "long" })}
          </p>
          <span className="type-body-s text-muted-foreground">Next week</span>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {days.map((d, i) => (
            <button
              key={i}
              type="button"
              disabled={d.full}
              onClick={() => setDayIdx(i)}
              className={cn(
                "flex min-w-[64px] flex-col items-center rounded-xl border px-3 py-3",
                d.full
                  ? "border-border text-disabled"
                  : dayIdx === i
                    ? "border-burgundy bg-blush-subtle"
                    : "border-border bg-card",
              )}
            >
              <span className="type-caption">{d.label}</span>
              <span className="type-h4">{d.full ? "Full" : d.day}</span>
            </button>
          ))}
        </div>

        <h3 className="mt-8 type-h4">Start time</h3>
        <p className="type-caption text-muted-foreground">
          {svc.name} takes about {duration(svc.minutes)}.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TIMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTime(t)}
              className={cn(
                "min-h-11 rounded-full border px-4 type-body-s-semibold",
                time === t
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <h3 className="mt-8 type-h4">Stylist</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {STYLISTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStylist(s)}
              className={cn(
                "min-h-11 rounded-full border px-4 type-body-s-semibold",
                stylist === s ? "border-burgundy bg-blush-subtle" : "border-border bg-card",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <h3 className="mt-8 type-h4">Add-ons</h3>
        <ul className="mt-3 space-y-2">
          {data.addons
            .filter((a) => a.id !== "home-visit" || data.provider.homeVisits)
            .slice(0, 2)
            .map((a) => (
              <label
                key={a.id}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
              >
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={addons.includes(a.id)}
                    onChange={() =>
                      setAddons((x) =>
                        x.includes(a.id) ? x.filter((y) => y !== a.id) : [...x, a.id],
                      )
                    }
                  />
                  <span>
                    <span className="block type-body-s-semibold">{a.label}</span>
                  </span>
                </span>
                <span className="type-body-s-semibold">{a.coins} coins</span>
              </label>
            ))}
        </ul>
      </div>

      <aside className="h-fit rounded-xl border border-border bg-card p-5 lg:sticky lg:top-28">
        <p className="type-body-s-semibold">{data.provider.name}</p>
        <p className="type-h4">{svc.name}</p>
        <dl className="mt-4 space-y-2 type-body-s">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">When</dt>
            <dd>{whenLabel}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Stylist</dt>
            <dd>{stylist}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Coins to hold</dt>
            <dd className="type-body-s-semibold">{num(total)}</dd>
          </div>
        </dl>
        <button
          type="button"
          className={buttonClass({ full: true, className: "mt-5" })}
          onClick={() => {
            if (
              search.when === "taken" ||
              (stylist === "Wanjiku" && time === "10:00" && dayIdx === 5 && false)
            ) {
              setSlotTaken(true);
              return;
            }
            goReview();
          }}
        >
          Review booking
        </button>
        <button
          type="button"
          className="mt-2 w-full type-caption text-muted-foreground underline"
          onClick={() => setSlotTaken(true)}
        >
          Preview “slot taken” state
        </button>
      </aside>

      <SlotTakenSheet
        open={slotTaken}
        onClose={() => setSlotTaken(false)}
        whenLabel={whenLabel}
        stylist={stylist}
        alternatives={[
          {
            label: whenLabel.replace(time, "11:00"),
            meta: `${stylist} · about ${duration(svc.minutes)}`,
            coins: total,
            value: "11:00",
          },
          {
            label: whenLabel,
            meta: `Any stylist · about ${duration(svc.minutes)}`,
            coins: total,
            value: "any",
          },
        ]}
        onPick={(v) => {
          if (v === "11:00") setTime("11:00");
          if (v === "any") setStylist("Any stylist");
          setSlotTaken(false);
          goReview();
        }}
      />
    </div>
  );
}
