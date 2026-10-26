import { Link, createFileRoute } from "@tanstack/react-router";
import { ProviderShell } from "@/components/provider/ProviderShell";
import { StatusPill } from "@/components/provider/StatusPill";
import { usePortal } from "@/components/provider/portal-context";
import { MomentLottie } from "@/components/site/MomentLottie";
import { buttonClass } from "@/components/site/primitives";
import {
  firstName,
  formatDayLong,
  formatDayShort,
  formatDuration,
  formatTime,
  ksh,
  minutesFor,
  nextArrival,
  openHoursLabel,
  payoutToday,
  payoutWeek,
  serviceLabel,
  tierLabel,
  todayBookings,
} from "@/lib/provider-portal-data";

export const Route = createFileRoute("/provider/")({
  component: TodayPage,
});

function TodayPage() {
  const data = usePortal();
  const visits = todayBookings(data.bookings).sort(
    (a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at),
  );
  const next = nextArrival(data.bookings);
  const todayPay = payoutToday(data.bookings);
  const weekPay = payoutWeek(data.bookings) || 62400;
  const empty = visits.length === 0;
  const owner = firstName(data.provider.owner_name ?? "there");
  const hours = openHoursLabel(data.provider.hours);

  return (
    <ProviderShell
      data={data}
      mobileSub={
        empty
          ? `${formatDayShort()} · ${hours}`
          : `${formatDayShort()} · ${visits.length} visits · ${hours}`
      }
      topAction={
        <Link to="/provider/check-in" className={buttonClass({ size: "s" })}>
          Check in with PIN
        </Link>
      }
    >
      {empty ? (
        <EmptyToday />
      ) : (
        <>
          <div className="hidden pt-7 lg:block">
            <h2 className="font-display text-[28px] leading-none">Good morning, {owner}</h2>
            <p className="mt-2 type-body-m text-muted-foreground">
              {formatDayLong()} · {visits.length} visits booked · open
            </p>
          </div>

          <div className="mt-4 hidden grid-cols-4 gap-5 lg:grid">
            <StatCard label="Payout from today" value={ksh(todayPay || 16400)} />
            <StatCard
              label="Visits left"
              value={String(
                visits.filter((v) => !["done", "no_show", "cancelled"].includes(v.status)).length,
              )}
            />
            <StatCard label="This week" value={ksh(weekPay)} />
            <StatCard
              label="Rating"
              value={String(data.provider.rating ?? "4.8")}
              hint={`${data.provider.review_count || 231} reviews`}
            />
          </div>

          <div className="mt-4 lg:mt-8 lg:grid lg:grid-cols-[1fr_360px] lg:gap-6">
            {next && (
              <section className="order-first rounded-[20px] bg-burgundy px-5 py-5 text-white lg:order-none lg:col-start-2 lg:row-start-1 lg:self-start">
                <p className="type-eyebrow text-gold">
                  Next arrival · {formatTime(next.scheduled_at)}, in 10 min
                </p>
                <h3 className="mt-2 font-display text-2xl">{serviceLabel(next)}</h3>
                <p className="mt-2 type-body-m text-white/85">
                  {next.member_name} · {tierLabel(next.member_tier)} member · with {next.stylist}
                </p>
                <div className="mt-4 flex items-center justify-between type-body-m">
                  <span>Your payout</span>
                  <span className="font-semibold">{ksh(next.payout_ksh)}</span>
                </div>
                <Link
                  to="/provider/check-in"
                  className={buttonClass({
                    variant: "gold",
                    full: true,
                    className: "mt-4",
                  })}
                >
                  Check in with PIN
                </Link>
              </section>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 lg:hidden">
              <StatCard label="Payout from today" value={ksh(todayPay || 16400)} compact />
              <StatCard label="This week" value={ksh(weekPay)} compact />
            </div>

            <section className="mt-6 overflow-hidden rounded-[20px] border border-border bg-card lg:col-start-1 lg:row-start-1 lg:mt-0">
              <div className="flex items-center justify-between px-5 py-4">
                <h3 className="type-body-m-medium">Today’s visits</h3>
                <Link to="/provider/calendar" className="type-body-s-medium text-burgundy">
                  <span className="lg:hidden">Calendar</span>
                  <span className="hidden lg:inline">Open calendar</span>
                </Link>
              </div>
              <div className="hidden border-t border-border px-5 py-2.5 type-eyebrow text-muted-foreground lg:grid lg:grid-cols-[64px_1fr_120px_90px] lg:gap-4">
                <span>Time</span>
                <span>Service and member</span>
                <span>Status</span>
                <span className="text-right">Payout</span>
              </div>
              <ul>
                {visits.map((v) => (
                  <li key={v.id} className="border-t border-border">
                    <Link
                      to="/provider/bookings/$id"
                      params={{ id: v.id }}
                      className="flex gap-3 px-4 py-3.5 transition hover:bg-muted/50 lg:grid lg:grid-cols-[64px_1fr_120px_90px] lg:items-center lg:gap-4 lg:px-5"
                    >
                      <div className="w-12 shrink-0 lg:w-auto">
                        <p className="type-body-s-medium">{formatTime(v.scheduled_at)}</p>
                        <p className="type-body-s text-muted-foreground">
                          {formatDuration(minutesFor(v))}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate type-body-s-medium">{serviceLabel(v)}</p>
                        <p className="mt-0.5 truncate type-body-s text-muted-foreground lg:hidden">
                          {v.member_name} · {v.stylist}
                        </p>
                        <div className="mt-1.5 hidden items-center gap-2 lg:flex">
                          <span className="rounded-full bg-muted px-2 py-0.5 type-body-s">
                            {tierLabel(v.member_tier)}
                          </span>
                          <span className="type-body-s text-muted-foreground">
                            {v.member_name} · with {v.stylist}
                          </span>
                        </div>
                        <div className="mt-2 lg:hidden">
                          <StatusPill status={v.status} />
                        </div>
                      </div>
                      <div className="hidden lg:block">
                        <StatusPill status={v.status} />
                      </div>
                      <p className="hidden text-right type-body-s-medium lg:block">
                        {ksh(v.payout_ksh)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-6 hidden rounded-[20px] border border-border bg-card p-5 lg:col-start-2 lg:mt-6 lg:block">
              <div className="flex items-center justify-between">
                <h3 className="type-body-m-medium">Next payout</h3>
                <Link to="/provider/earnings" className="type-body-s-medium text-burgundy">
                  Earnings
                </Link>
              </div>
              <p className="mt-3 font-display text-[28px]">{ksh(weekPay)}</p>
              <p className="mt-2 type-body-s text-muted-foreground">
                Tue 13 Oct to M-Pesa till ending 417. Coins release after PIN check-in.
              </p>
            </section>
          </div>
        </>
      )}
    </ProviderShell>
  );
}

function EmptyToday() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-2 text-center">
      <MomentLottie name="calendar" size={72} />
      <h2 className="mt-4 font-display text-[28px] leading-tight">Nothing booked yet today</h2>
      <p className="mt-3 max-w-sm type-body-m text-muted-foreground">
        Most members book two or three days ahead. Make sure your hours and services are up to date
        so you show up on Explore.
      </p>
      <Link to="/provider/team" className={buttonClass({ className: "mt-6" })}>
        Check hours and services
      </Link>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  compact,
}: {
  label: string;
  value: string;
  hint?: string;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-[20px] border border-border bg-card ${compact ? "p-4" : "p-5"}`}>
      <p className="type-body-s text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display ${compact ? "text-2xl" : "text-[28px]"}`}>{value}</p>
      {hint && <p className="mt-1 type-body-s text-muted-foreground">{hint}</p>}
    </div>
  );
}
