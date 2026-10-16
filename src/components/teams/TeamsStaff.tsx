import { useMemo, useState } from "react";
import { TierBadge, buttonClass } from "@/components/site/primitives";
import { TEAMS_DEMO, type TeamsSeat } from "@/lib/teams-demo";
import { TeamsShell, initialsAvatar } from "./TeamsShell";
import { InviteSheet, ChangeTierSheet, MoveSeatSheet } from "./TeamsSheets";
import { cn } from "@/lib/utils";

const FILTERS = [
  "All 20",
  "Active 18",
  "Invited 2",
  "Basic 8",
  "Intermediate 10",
  "Premium 2",
] as const;

export function TeamsStaff({ openInvite = false }: { openInvite?: boolean }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All 20");
  const [inviteOpen, setInviteOpen] = useState(openInvite);
  const [changeSeat, setChangeSeat] = useState<TeamsSeat | null>(null);
  const [moveSeat, setMoveSeat] = useState<TeamsSeat | null>(null);

  const rows = useMemo(() => {
    return TEAMS_DEMO.seatsList.filter((s) => {
      if (filter.startsWith("Active")) return s.status === "active";
      if (filter.startsWith("Invited")) return s.status === "invited";
      if (filter.startsWith("Basic")) return s.tier === "basic";
      if (filter.startsWith("Intermediate")) return s.tier === "intermediate";
      if (filter.startsWith("Premium")) return s.tier === "premium";
      return true;
    });
  }, [filter]);

  return (
    <>
      <TeamsShell
        title="Staff"
        searchPlaceholder="Search name or phone"
        onInvite={() => setInviteOpen(true)}
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-3 py-2 type-body-s",
                filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
              )}
            >
              {f}
            </button>
          ))}
          <button
            type="button"
            className={cn(buttonClass({ variant: "secondary", size: "s" }), "ml-auto")}
          >
            Upload a list (CSV)
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-border type-label-s text-muted-foreground">
                <th className="px-4 py-3 font-bold">Name</th>
                <th className="px-4 py-3 font-bold">Team</th>
                <th className="px-4 py-3 font-bold">Tier</th>
                <th className="px-4 py-3 font-bold">Coins used this month</th>
                <th className="px-4 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="flex items-center gap-3 text-left"
                      onClick={() => {
                        if (s.status === "leaving") setMoveSeat(s);
                        else if (s.status === "active") setChangeSeat(s);
                      }}
                    >
                      {initialsAvatar(s.initials)}
                      <span>
                        <span className="block type-body-s-medium">{s.fullName}</span>
                        <span className="block type-caption text-muted-foreground">{s.phone}</span>
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 type-body-s">{s.team}</td>
                  <td className="px-4 py-3">
                    <TierBadge tier={s.tier} />
                  </td>
                  <td className="px-4 py-3 type-body-s">
                    {s.status === "invited"
                      ? "Starts when they join"
                      : `${s.coinsUsed.toLocaleString("en-KE")} of ${s.coinsAllowance.toLocaleString("en-KE")}`}
                  </td>
                  <td className="px-4 py-3 type-body-s text-muted-foreground">{s.statusLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="type-caption mt-4 text-muted-foreground">
          Showing {rows.length} of 20 · 8 Basic, 10 Intermediate, 2 Premium
        </p>
      </TeamsShell>

      <InviteSheet open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <ChangeTierSheet open={!!changeSeat} seat={changeSeat} onClose={() => setChangeSeat(null)} />
      <MoveSeatSheet open={!!moveSeat} seat={moveSeat} onClose={() => setMoveSeat(null)} />
    </>
  );
}
