import { Link, createFileRoute } from "@tanstack/react-router";
import { useMember } from "@/components/app/MemberContext";
import { buttonClass } from "@/components/site/primitives";
import { fetchMemberHome } from "@/lib/app-data";

export const Route = createFileRoute("/app/notifications")({
  validateSearch: (raw: Record<string, unknown>) => ({
    demo: typeof raw["demo"] === "string" ? raw["demo"] : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const home = await fetchMemberHome(deps.demo ?? null).catch(() => null);
    return { home };
  },
  component: NotificationsPage,
});

function NotificationsPage() {
  const { home } = Route.useLoaderData();
  const { member, demo } = useMember();
  if (!member) return null;

  const upcoming = home?.upcoming?.[0];
  const items = [
    upcoming
      ? {
          title: `${upcoming.serviceName} today`,
          body: `${upcoming.providerName} · your arrival pass is ready`,
          when: "08:00",
          unread: true,
          to: `/app/bookings/${upcoming.id}`,
        }
      : null,
    {
      title: "Top-up and plan updates",
      body: "Low balance, rollover and renewal dates land here.",
      when: "Earlier",
      unread: true,
      to: "/app/wallet",
    },
    ...(home?.activity ?? []).slice(0, 4).map((a) => ({
      title: a.note ?? a.kind,
      body: a.kind,
      when: new Date(a.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      unread: false,
      to: a.bookingId ? `/app/bookings/${a.bookingId}` : "/app/wallet",
    })),
  ].filter(Boolean) as {
    title: string;
    body: string;
    when: string;
    unread: boolean;
    to: string;
  }[];

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="type-body-s text-muted-foreground">
          {items.filter((i) => i.unread).length} unread
        </p>
        <button type="button" className={buttonClass({ size: "s", variant: "ghost" })}>
          Mark all as read
        </button>
      </div>
      <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
        {items.map((n, i) => (
          <li key={i}>
            {n.to.startsWith("/app/bookings/") ? (
              <Link
                to="/app/bookings/$id"
                params={{ id: n.to.split("/").pop()! }}
                search={(demo ? { demo } : {}) as never}
                className="flex gap-3 px-4 py-4"
              >
                <NotifBody n={n} />
              </Link>
            ) : (
              <Link
                to={n.to as "/app/wallet"}
                search={(demo ? { demo } : {}) as never}
                className="flex gap-3 px-4 py-4"
              >
                <NotifBody n={n} />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NotifBody({ n }: { n: { title: string; body: string; when: string; unread: boolean } }) {
  return (
    <>
      <span
        className={`mt-2 size-2 shrink-0 rounded-full ${n.unread ? "bg-burgundy" : "bg-transparent"}`}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className="type-body-s-semibold">{n.title}</span>
          <span className="shrink-0 type-caption text-muted-foreground">{n.when}</span>
        </span>
        <span className="mt-0.5 block type-body-s text-muted-foreground">{n.body}</span>
      </span>
    </>
  );
}
