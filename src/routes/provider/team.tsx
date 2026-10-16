import { createFileRoute } from "@tanstack/react-router";
import { ProviderShell } from "@/components/provider/ProviderShell";
import { usePortal } from "@/components/provider/portal-context";
import { buttonClass } from "@/components/site/primitives";
import { DEMO_TEAM, DEMO_TIME_OFF, initials } from "@/lib/provider-portal-data";

export const Route = createFileRoute("/provider/team")({
  component: TeamPage,
});

function TeamPage() {
  const data = usePortal();
  const hours = data.provider.hours.length
    ? data.provider.hours
    : [
        { days: "Mon to Fri", open: "8:00", close: "19:00" },
        { days: "Saturday", open: "8:00", close: "19:00" },
        { days: "Sunday", open: "10:00", close: "16:00" },
      ];

  return (
    <ProviderShell
      data={data}
      title="Team and hours"
      topAction={
        <button type="button" className={buttonClass({ size: "s" })}>
          Invite team member
        </button>
      }
    >
      <div className="pt-4 lg:pt-7">
        <p className="type-body-s text-muted-foreground">{DEMO_TEAM.length} people</p>

        <div className="mt-4 overflow-hidden rounded-[20px] border border-border bg-card">
          <div className="hidden grid-cols-[1.5fr_1fr_0.7fr_1fr] gap-3 border-b border-border px-5 py-3 type-eyebrow text-muted-foreground lg:grid">
            <span>Person</span>
            <span>Works</span>
            <span>Rating</span>
            <span>Access</span>
          </div>
          <ul>
            {DEMO_TEAM.map((m) => (
              <li
                key={m.name}
                className="flex gap-3 border-t border-border px-4 py-4 first:border-0 lg:grid lg:grid-cols-[1.5fr_1fr_0.7fr_1fr] lg:items-center lg:px-5"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-muted type-body-s-semibold">
                    {initials(m.name)}
                  </span>
                  <div>
                    <p className="type-body-s-medium">{m.name}</p>
                    <p className="type-body-s text-muted-foreground">{m.role}</p>
                  </div>
                </div>
                <p className="type-body-s text-muted-foreground lg:text-foreground">{m.works}</p>
                <p className="type-body-s">{m.rating ? `★ ${m.rating}` : "—"}</p>
                <p className="type-body-s-medium">{m.access}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <section className="rounded-[20px] border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="type-body-m-medium">Opening hours</h3>
              <button type="button" className="type-body-s-medium text-burgundy">
                Edit
              </button>
            </div>
            <ul className="mt-4 space-y-3">
              {hours.map((h) => (
                <li key={h.days} className="flex justify-between gap-3 type-body-s">
                  <span className="text-muted-foreground">{h.days}</span>
                  <span className="type-body-s-medium">
                    {h.close ? `${h.open} to ${h.close}` : h.open}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 type-body-s text-muted-foreground">
              Members can book up to 30 days ahead, in 30-minute steps.
            </p>
          </section>

          <section className="rounded-[20px] border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="type-body-m-medium">Time off</h3>
              <button type="button" className="type-body-s-medium text-burgundy">
                Add
              </button>
            </div>
            <ul className="mt-4 space-y-3">
              {DEMO_TIME_OFF.map((t) => (
                <li key={`${t.who}-${t.when}`} className="flex justify-between gap-3 type-body-s">
                  <span className="type-body-s-medium">{t.who}</span>
                  <span className="text-muted-foreground">{t.when}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </ProviderShell>
  );
}
