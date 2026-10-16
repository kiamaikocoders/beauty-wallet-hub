import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ProviderShell } from "@/components/provider/ProviderShell";
import { usePortal } from "@/components/provider/portal-context";
import { buttonClass } from "@/components/site/primitives";
import {
  formatDayLong,
  formatTime,
  minutesFor,
  serviceLabel,
  tierLabel,
  todayBookings,
} from "@/lib/provider-portal-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/provider/calendar")({
  component: CalendarPage,
});

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

function CalendarPage() {
  const data = usePortal();
  const [filter, setFilter] = useState<"all" | "Wanjiku" | "Achieng">("all");
  const visits = todayBookings(data.bookings)
    .filter((v) => filter === "all" || v.stylist === filter)
    .sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at));

  const byStylist = {
    Wanjiku: visits.filter((v) => v.stylist === "Wanjiku"),
    Achieng: visits.filter((v) => v.stylist === "Achieng"),
  };

  return (
    <ProviderShell
      data={data}
      topAction={
        <button type="button" className={buttonClass({ size: "s", variant: "secondary" })}>
          Block time
        </button>
      }
    >
      <div className="pt-4 lg:pt-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl">{formatDayLong()}</h2>
          <div className="hidden rounded-full border border-border bg-card p-1 lg:flex">
            <span className="rounded-full bg-primary px-4 py-1.5 type-button-s text-primary-foreground">
              Day
            </span>
            <span className="px-4 py-1.5 type-button-s text-muted-foreground">Week</span>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {(["all", "Wanjiku", "Achieng"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-4 py-2 type-body-s-medium whitespace-nowrap",
                filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
              )}
            >
              {f === "all" ? "Everyone" : f}
            </button>
          ))}
        </div>

        {/* Mobile agenda */}
        <ul className="mt-4 space-y-3 lg:hidden">
          {visits.map((v) => (
            <li key={v.id}>
              <Link
                to="/provider/bookings/$id"
                params={{ id: v.id }}
                className="flex gap-3 rounded-[16px] border border-border bg-card p-4"
              >
                <span className="w-12 shrink-0 type-body-s-medium">
                  {formatTime(v.scheduled_at)}
                </span>
                <div className="min-w-0">
                  <p className="type-body-s-medium">{serviceLabel(v)}</p>
                  <p className="mt-1 type-body-s text-muted-foreground">
                    {v.stylist} · {v.member_name} · {tierLabel(v.member_tier)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop columns */}
        <div className="mt-6 hidden grid-cols-2 gap-5 lg:grid">
          {(["Wanjiku", "Achieng"] as const).map((stylist) => (
            <section
              key={stylist}
              className="overflow-hidden rounded-[20px] border border-border bg-card"
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h3 className="type-body-m-medium">{stylist}</h3>
                <span className="type-body-s text-muted-foreground">
                  {byStylist[stylist].length} visits
                </span>
              </div>
              <div className="relative min-h-[520px] px-3 py-2">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="flex h-11 items-start border-t border-border/70 px-2 pt-1"
                  >
                    <span className="w-12 type-body-s text-muted-foreground">
                      {String(h).padStart(2, "0")}:00
                    </span>
                  </div>
                ))}
                {byStylist[stylist].map((v) => {
                  const start = new Date(v.scheduled_at);
                  const hour = Number(
                    start
                      .toLocaleTimeString("en-KE", {
                        hour: "2-digit",
                        hour12: false,
                        timeZone: "Africa/Nairobi",
                      })
                      .split(":")[0],
                  );
                  const top = (hour - 8) * 44 + 8;
                  const height = Math.max(44, (minutesFor(v) / 60) * 44);
                  return (
                    <Link
                      key={v.id}
                      to="/provider/bookings/$id"
                      params={{ id: v.id }}
                      className="absolute right-3 left-16 overflow-hidden rounded-xl bg-blush px-3 py-2"
                      style={{ top, height: Math.min(height, 160) }}
                    >
                      <p className="truncate type-body-s-semibold">{serviceLabel(v)}</p>
                      <p className="truncate type-body-s text-muted-foreground">
                        {formatTime(v.scheduled_at)} · {v.member_name} · {tierLabel(v.member_tier)}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </ProviderShell>
  );
}
