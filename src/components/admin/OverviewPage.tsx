import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { buttonClass } from "@/components/site/primitives";
import { TierBadge } from "@/components/site/primitives";
import { OVERVIEW } from "@/lib/admin-seed";
import { fetchAdminDirectory } from "@/lib/admin-live";
import { AdminIcon, CardPanel, Panel, SectionTitle, StatCard } from "./ui";

const attentionIcons: Record<string, string> = {
  apps: "store",
  disputes: "flag",
  holds: "banknote",
  price: "pencil",
};

export function OverviewPage() {
  const [liveMembers, setLiveMembers] = useState<number | null>(null);
  const [liveBookings, setLiveBookings] = useState<number | null>(null);

  useEffect(() => {
    void fetchAdminDirectory().then((dir) => {
      if (!dir) return;
      setLiveMembers(dir.stats.members);
      setLiveBookings(dir.stats.bookingsThisMonth);
    });
  }, []);

  const maxVisits = Math.max(...OVERVIEW.visitsPerDay.map((d) => d.count));
  const maxPlan = Math.max(...OVERVIEW.membersByPlan.map((p) => p.count));

  return (
    <div className="flex flex-col gap-5">
      <p className="type-body-s text-muted-foreground lg:hidden">{OVERVIEW.mobileDate}</p>

      <div className="flex flex-col gap-3 rounded-lg border border-destructive bg-destructive-bg p-[18px] lg:flex-row lg:items-center lg:gap-3.5">
        <AdminIcon name="alert-triangle" size={22} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="type-body-s-semibold text-foreground">{OVERVIEW.warningTitle}</p>
          <p className="type-body-s text-foreground">{OVERVIEW.warningBody}</p>
        </div>
        <Link
          to="/admin/rates"
          className={buttonClass({ size: "s", className: "shrink-0 self-start lg:self-center" })}
        >
          Review rate bands
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:hidden">
        {OVERVIEW.mobileStats.map((s) => (
          <CardPanel key={s.label} className="gap-1">
            <p className="type-caption text-muted-foreground">{s.label}</p>
            <p className="type-h3 text-foreground">{s.value}</p>
          </CardPanel>
        ))}
      </div>

      <div className="hidden gap-5 lg:flex">
        {OVERVIEW.stats.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={
              s.label === "Active members" && liveMembers !== null
                ? liveMembers.toLocaleString("en-KE")
                : s.label.startsWith("Visits") && liveBookings !== null
                  ? liveBookings.toLocaleString("en-KE")
                  : s.value
            }
            delta={s.delta}
            deltaTone={s.deltaTone}
          />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel className="hidden lg:flex lg:flex-col lg:gap-3.5">
          <SectionTitle
            title="Visits per day"
            action={<span className="type-body-s-semibold text-muted-foreground">October</span>}
          />
          <div className="flex items-end gap-3">
            {OVERVIEW.visitsPerDay.map((d, i) => {
              const h = Math.max(28, Math.round((d.count / maxVisits) * 150));
              const last = i === OVERVIEW.visitsPerDay.length - 1;
              return (
                <div key={d.day} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                  <span className="type-caption text-muted-foreground">{d.count}</span>
                  <div
                    className={
                      last ? "w-full rounded-md bg-burgundy" : "w-full rounded-md bg-blush"
                    }
                    style={{ height: h }}
                  />
                  <span className="type-caption text-muted-foreground">{d.day}</span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel className="flex flex-col gap-1">
          <SectionTitle title="Needs attention" className="mb-3" />
          {OVERVIEW.attention.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 border-t border-border py-3.5 first:border-t-0 first:pt-0"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <AdminIcon name={attentionIcons[item.id] ?? "alert-triangle"} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="type-body-s-semibold">{item.title}</p>
                <p className="type-caption text-muted-foreground">{item.detail}</p>
              </div>
              <Link to={item.href} className="type-body-s-semibold text-burgundy">
                {item.action}
              </Link>
            </div>
          ))}
        </Panel>
      </div>

      <div className="hidden gap-5 lg:grid lg:grid-cols-3">
        <Panel className="flex flex-col gap-4">
          <SectionTitle
            title="Members by plan"
            action={
              <span className="type-body-s-semibold text-muted-foreground">1,284 active</span>
            }
          />
          {OVERVIEW.membersByPlan.map((p) => (
            <div key={p.tier} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <TierBadge tier={p.tier} />
                <span className="type-body-s-semibold">{p.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-burgundy"
                  style={{ width: `${Math.round((p.count / maxPlan) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </Panel>

        <Panel className="flex flex-col gap-1">
          <SectionTitle title="Coins right now" className="mb-3" />
          {OVERVIEW.coins.map((c) => (
            <div
              key={c.label}
              className="flex items-center justify-between gap-3 border-t border-border py-3 first:border-t-0 first:pt-0"
            >
              <span className="type-body-s text-muted-foreground">{c.label}</span>
              <span className="type-body-s-semibold">{c.value}</span>
            </div>
          ))}
        </Panel>

        <div className="flex flex-col justify-between rounded-[20px] bg-primary p-5 text-primary-foreground">
          <p className="type-eyebrow text-gold">{OVERVIEW.nextPayout.eyebrow}</p>
          <div>
            <p className="mt-6 font-display text-[36px] leading-[1.15] tracking-[-0.02em]">
              {OVERVIEW.nextPayout.amount}
            </p>
            <p className="mt-2 type-body-s text-primary-foreground/70">
              {OVERVIEW.nextPayout.detail}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
