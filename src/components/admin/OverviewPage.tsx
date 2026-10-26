import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchOpsBoard, type OpsBoard } from "@/lib/admin-ops";
import { Panel, SectionTitle, StatCard } from "./ui";

export function OverviewPage() {
  const [board, setBoard] = useState<OpsBoard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchOpsBoard()
      .then((next) => {
        if (!next) setError("The operations board did not load.");
        else setBoard(next);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "The operations board did not load.");
      });
  }, []);

  if (!board) {
    return <p className="type-body-s text-muted-foreground">{error ?? "Loading the live board…"}</p>;
  }

  const maxVisits = Math.max(1, ...board.visits.map((day) => day.count));
  const attention = [
    {
      title: `${board.applications} provider applications`,
      detail: board.queue[0] ? `Newest: ${board.queue[0].name}` : "None waiting",
      href: "/admin/providers" as const,
      action: "Review",
    },
    {
      title: `${board.openDisputes} open disputes`,
      detail: "Resolve from the live dispute list",
      href: "/admin/disputes" as const,
      action: "Open",
    },
    {
      title: `${board.missingPins} studios without a pin`,
      detail: "They stay off the map until a location is saved",
      href: "/admin/map" as const,
      action: "Map",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Members" value={board.members.toLocaleString("en-KE")} />
        <StatCard label="Live studios" value={String(board.liveProviders)} />
        <StatCard
          label="Applications"
          value={String(board.applications)}
          delta={board.applications > 0 ? "Waiting on a decision" : "Queue is clear"}
          deltaTone={board.applications > 0 ? "warning" : "success"}
        />
        <StatCard label="Visits today" value={String(board.bookingsToday)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel className="flex flex-col gap-3.5">
          <SectionTitle title="Visits, last 7 days" />
          <div className="flex items-end gap-3">
            {board.visits.map((day, index) => {
              const height = Math.max(28, Math.round((day.count / maxVisits) * 150));
              const last = index === board.visits.length - 1;
              return (
                <div key={day.day + index} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                  <span className="type-caption text-muted-foreground">{day.count}</span>
                  <div
                    className={last ? "w-full rounded-md bg-burgundy" : "w-full rounded-md bg-blush"}
                    style={{ height }}
                  />
                  <span className="type-caption text-muted-foreground">{day.day}</span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel className="flex flex-col gap-1">
          <SectionTitle title="Needs a decision" className="mb-3" />
          {attention.map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-3 border-t border-border py-3.5 first:border-t-0 first:pt-0"
            >
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

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <SectionTitle
            title="Applications in review"
            action={
              <Link to="/admin/providers" className="type-body-s-semibold text-burgundy">
                All providers
              </Link>
            }
          />
          <ul className="mt-3">
            {board.queue.length === 0 && (
              <li className="type-body-s text-muted-foreground">No studio is waiting.</li>
            )}
            {board.queue.map((item) => (
              <li key={item.slug} className="border-t border-border py-3 first:border-t-0">
                <Link to="/admin/providers/$slug" params={{ slug: item.slug }} className="hover:underline">
                  <p className="type-body-s-semibold">{item.name}</p>
                  <p className="type-caption text-muted-foreground">
                    {item.area} · {item.kind || "Studio"} · {item.appliedAt} · {item.ref || "no ref"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <SectionTitle
            title="Latest operator actions"
            action={
              <Link to="/admin/audit" className="type-body-s-semibold text-burgundy">
                Full log
              </Link>
            }
          />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/60 p-3">
              <p className="type-caption text-muted-foreground">Coins in wallets</p>
              <p className="type-body-s-semibold">{board.coinsOutstanding.toLocaleString("en-KE")}</p>
            </div>
            <div className="rounded-lg bg-muted/60 p-3">
              <p className="type-caption text-muted-foreground">Coins on hold</p>
              <p className="type-body-s-semibold">{board.coinsOnHold.toLocaleString("en-KE")}</p>
            </div>
          </div>
          <ul className="mt-3">
            {board.audit.length === 0 && (
              <li className="type-body-s text-muted-foreground">No admin actions recorded yet.</li>
            )}
            {board.audit.map((item, index) => (
              <li key={item.at + index} className="border-t border-border py-3">
                <p className="type-body-s-semibold">{item.action.replaceAll("_", " ")}</p>
                <p className="type-caption text-muted-foreground">
                  {item.at} · {item.detail}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
