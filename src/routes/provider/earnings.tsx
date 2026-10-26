import { createFileRoute } from "@tanstack/react-router";
import { ProviderShell } from "@/components/provider/ProviderShell";
import { usePortal } from "@/components/provider/portal-context";
import { ksh, type PortalBooking } from "@/lib/provider-portal-data";

export const Route = createFileRoute("/provider/earnings")({
  component: EarningsPage,
});

function weekStart(iso: string) {
  const day = new Date(iso).toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
  const date = new Date(`${day}T00:00:00Z`);
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - weekday + 1);
  return date.toISOString().slice(0, 10);
}

function counted(bookings: PortalBooking[]) {
  return bookings.filter((booking) => booking.status === "done" || booking.status === "no_show");
}

function EarningsPage() {
  const data = usePortal();
  const visits = counted(data.bookings);
  const groups = new Map<string, { amount: number; visits: number }>();
  for (const booking of visits) {
    const key = weekStart(booking.scheduled_at);
    const current = groups.get(key) ?? { amount: 0, visits: 0 };
    current.amount += booking.payout_ksh;
    current.visits += 1;
    groups.set(key, current);
  }
  const weeks = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
  const thisWeek = groups.get(weekStart(new Date().toISOString())) ?? { amount: 0, visits: 0 };
  const maxBar = Math.max(1, ...weeks.map(([, week]) => week.amount));
  const method = data.provider.payout_method || "Payout details not added";

  return (
    <ProviderShell data={data}>
      <div className="pt-4 lg:pt-7">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[20px] bg-burgundy p-5 text-white">
            <p className="type-eyebrow text-gold">This week, calculated</p>
            <p className="mt-2 font-display text-[36px]">{ksh(thisWeek.amount)}</p>
            <p className="mt-2 type-body-s text-white/80">
              {thisWeek.visits} completed or no-show visits · {method}
            </p>
          </div>
          <Stat label="Visits in this view" value={String(visits.length)} hint="Last two weeks of portal bookings" />
          <Stat label="Share in this view" value={ksh(visits.reduce((sum, booking) => sum + booking.payout_ksh, 0))} hint="Not a bank transfer" />
        </div>

        <section className="mt-6 rounded-[20px] border border-border bg-card p-5">
          <h3 className="type-body-m-medium">Weekly calculated payout</h3>
          {weeks.length === 0 && (
            <p className="mt-4 type-body-s text-muted-foreground">No completed visits in the bookings this portal can see.</p>
          )}
          <div className="mt-6 flex h-40 items-end gap-3">
            {weeks.map(([label, week]) => (
              <div key={label} className="flex flex-1 flex-col items-center gap-2">
                <span className="type-body-s text-muted-foreground">{ksh(week.amount)}</span>
                <div className="w-full rounded-t-lg bg-burgundy" style={{ height: `${Math.max(12, (week.amount / maxBar) * 120)}px` }} />
                <span className="type-body-s text-muted-foreground">{label.slice(5)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ProviderShell>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[20px] border border-border bg-card p-5">
      <p className="type-body-s text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-[28px]">{value}</p>
      <p className="mt-2 type-body-s text-muted-foreground">{hint}</p>
    </div>
  );
}
