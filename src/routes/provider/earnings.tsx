import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ProviderShell } from "@/components/provider/ProviderShell";
import { usePortal } from "@/components/provider/portal-context";
import { buttonClass } from "@/components/site/primitives";
import { DEMO_PAYOUTS, ksh, payoutWeek } from "@/lib/provider-portal-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/provider/earnings")({
  component: EarningsPage,
});

function EarningsPage() {
  const data = usePortal();
  const [hold, setHold] = useState(false);
  const week = payoutWeek(data.bookings) || 62400;
  const maxBar = Math.max(...DEMO_PAYOUTS.map((p) => p.amount));

  return (
    <ProviderShell
      data={data}
      topAction={
        <button type="button" className={buttonClass({ size: "s", variant: "secondary" })}>
          Download statement
        </button>
      }
    >
      <div className="pt-4 lg:pt-7">
        {hold && (
          <div className="mb-5 rounded-[20px] border border-warning/30 bg-warning-bg px-5 py-4">
            <p className="type-body-m-medium text-warning">Payouts on hold</p>
            <p className="mt-1 type-body-s text-foreground/80">
              Upload your Nairobi single business permit so we can release {ksh(week)} on Tue 13
              Oct.
            </p>
            <button type="button" className={buttonClass({ size: "s", className: "mt-3" })}>
              Upload permit
            </button>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <div className={cn("rounded-[20px] p-5 text-white", hold ? "bg-warning" : "bg-burgundy")}>
            <p className="type-eyebrow text-gold">
              {hold ? "On hold · Tue 13 Oct" : "Next payout, Tue 13 Oct"}
            </p>
            <p className="mt-2 font-display text-[36px]">{ksh(week)}</p>
            <p className="mt-2 type-body-s text-white/80">
              23 visits so far · to M-Pesa till ending 417
            </p>
          </div>
          <Stat label="Paid in October" value={ksh(71200)} hint="1 payout" />
          <Stat label="Paid in September" value={ksh(274800)} hint="+18% on August" />
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-[20px] border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="type-body-m-medium">Weekly payouts</h3>
              <span className="type-body-s text-muted-foreground">Last 6 weeks</span>
            </div>
            <div className="mt-6 flex h-40 items-end gap-3">
              {DEMO_PAYOUTS.map((p) => (
                <div key={p.label} className="flex flex-1 flex-col items-center gap-2">
                  <span className="type-body-s text-muted-foreground">{p.short}</span>
                  <div
                    className={cn(
                      "w-full rounded-t-lg",
                      p.status === "Pending" ? "bg-gold" : "bg-burgundy",
                    )}
                    style={{ height: `${Math.max(12, (p.amount / maxBar) * 120)}px` }}
                  />
                  <span className="type-body-s text-muted-foreground">{p.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[20px] border border-border bg-card p-5">
            <h3 className="type-body-m-medium">This week so far</h3>
            <ul className="mt-4 space-y-3 type-body-s">
              <li className="flex justify-between">
                <span className="text-muted-foreground">Visits checked in</span>
                <span>{ksh(60800)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Late cancellation fees</span>
                <span>{ksh(1600)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Adjustments</span>
                <span>{ksh(0)}</span>
              </li>
            </ul>
            <div className="mt-5 border-t border-border pt-4">
              <p className="type-body-s text-muted-foreground">Paid to</p>
              <p className="mt-1 type-body-s-medium">M-Pesa till ending 417</p>
              <p className="type-body-s text-muted-foreground">Mercy Wambui · verified</p>
            </div>
            <button
              type="button"
              onClick={() => setHold((h) => !h)}
              className="mt-4 type-body-s-medium text-burgundy"
            >
              {hold ? "Clear hold demo" : "Demo: payout on hold"}
            </button>
          </section>
        </div>

        <section className="mt-6 overflow-hidden rounded-[20px] border border-border bg-card">
          <h3 className="px-5 py-4 type-body-m-medium">Payout history</h3>
          <ul>
            {[...DEMO_PAYOUTS].reverse().map((p) => (
              <li
                key={p.label}
                className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-4"
              >
                <div>
                  <p className="type-body-s-medium">Tue {p.label}</p>
                  <p className="type-body-s text-muted-foreground">
                    {p.visits} visits · {p.range}
                  </p>
                </div>
                <div className="text-right">
                  <p className="type-body-s-medium">{ksh(p.amount)}</p>
                  <p className="type-body-s text-muted-foreground">{p.status}</p>
                </div>
              </li>
            ))}
          </ul>
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
      <p className="mt-1 type-body-s text-muted-foreground">{hint}</p>
    </div>
  );
}
