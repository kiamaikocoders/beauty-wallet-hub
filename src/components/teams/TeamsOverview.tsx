import { Icon } from "@/components/site/primitives";
import { TEAMS_DEMO } from "@/lib/teams-demo";
import { ksh } from "@/lib/pricing";
import { TeamsShell, StatTile, TierProgress, initialsAvatar } from "./TeamsShell";

export function TeamsOverview({ onInvite }: { onInvite?: (() => void) | undefined }) {
  const d = TEAMS_DEMO;
  return (
    <TeamsShell title="Overview" {...(onInvite ? { onInvite } : {})}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Seats"
          value={String(d.seats)}
          sub={`${d.active} active · ${d.invited} invites waiting`}
        />
        <StatTile
          label="Coins used in October"
          value={d.coinsUsed.toLocaleString("en-KE")}
          sub={`${Math.round((d.coinsUsed / d.coinsTotal) * 100)}% of ${d.coinsTotal.toLocaleString("en-KE")}`}
        />
        <StatTile label="Staff who booked" value={`${d.booked} of ${d.active}`} sub="This month" />
        <StatTile
          label="Monthly plan"
          value={ksh(d.nextInvoiceKsh)}
          sub={`Next invoice ${d.nextInvoiceDate}`}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6">
          <section className="rounded-lg border border-border bg-card p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="type-h4">Seats by tier</h2>
              <a href="/teams/staff" className="type-body-s-semibold text-burgundy">
                Manage staff
              </a>
            </div>
            <div className="flex flex-col gap-5">
              {d.tiers.map((t) => (
                <TierProgress
                  key={t.tier}
                  tier={t.tier}
                  seats={t.seats}
                  monthly={`${ksh(t.monthlyKsh)} a month`}
                  used={t.used}
                  total={t.total}
                />
              ))}
            </div>
          </section>

          <div className="flex items-start gap-3 rounded-lg border border-info/20 bg-info-bg px-4 py-3">
            <Icon name="shield-check" size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="type-body-s-semibold">Staff privacy</p>
              <p className="type-body-s text-muted-foreground">
                You see how many coins each person uses, never what they booked or where.
              </p>
            </div>
          </div>

          <section className="rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="type-h4">Not booked yet this month</h2>
              <button type="button" className="type-body-s-semibold text-burgundy">
                Send a reminder
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {d.notBooked.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center gap-3 rounded-md bg-muted/60 px-3 py-3"
                >
                  {initialsAvatar(p.initials)}
                  <div>
                    <p className="type-body-s-medium">{p.name}</p>
                    <p className="type-caption text-muted-foreground">{p.line}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="type-caption mt-4 text-muted-foreground">
              Reminders go by SMS. They don’t say who sent them.
            </p>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <h2 className="type-h4">Waiting to join</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 type-caption">
                {d.waiting.length}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {d.waiting.map((p) => (
                <div key={p.name} className="flex items-center gap-3">
                  {initialsAvatar(p.initials)}
                  <div className="min-w-0 flex-1">
                    <p className="type-body-s-medium">{p.name}</p>
                    <p className="type-caption text-muted-foreground">{p.line}</p>
                  </div>
                  <button type="button" className="type-body-s-semibold text-burgundy">
                    Resend
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="type-h4 mb-4">Recent activity</h2>
            <ul className="flex flex-col gap-4">
              {d.activity.map((a) => (
                <li key={a.title} className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-gold" />
                  <div>
                    <p className="type-body-s-medium">{a.title}</p>
                    <p className="type-caption text-muted-foreground">{a.when}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </TeamsShell>
  );
}
