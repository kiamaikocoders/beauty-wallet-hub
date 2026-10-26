import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchAudit, fetchHealth, type AuditRow, type HealthBoard } from "@/lib/command-center";
import { Panel, StatCard } from "./ui";

const CHECKS: { key: keyof HealthBoard; label: string; href: string; warn: boolean }[] = [
  { key: "applications", label: "Applications waiting", href: "/admin/providers", warn: false },
  { key: "staleApplications", label: "Applications older than 3 days", href: "/admin/providers", warn: true },
  { key: "openDisputes", label: "Open disputes", href: "/admin/disputes", warn: false },
  { key: "oldDisputes", label: "Disputes older than a day", href: "/admin/disputes", warn: true },
  { key: "missingPins", label: "Studios without a map pin", href: "/admin/map", warn: true },
  { key: "studiosWithoutEmail", label: "Applications without an email", href: "/admin/providers", warn: true },
  { key: "bookingsToday", label: "Bookings today", href: "/admin/bookings", warn: false },
  { key: "pausedMembers", label: "Paused member plans", href: "/admin/members", warn: false },
  { key: "giftsWaiting", label: "Gifts waiting", href: "/admin/gifts", warn: false },
  { key: "documents", label: "Uploaded documents", href: "/admin/providers", warn: false },
];

export function HealthPage() {
  const [board, setBoard] = useState<HealthBoard | null>(null);

  useEffect(() => {
    void fetchHealth()
      .then(setBoard)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load health"));
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <p className="type-body-s text-muted-foreground">
        These counts come from the live records. There is no scheduled job board yet, so nothing here pretends a cron ran.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CHECKS.map((check) => {
          const value = board ? board[check.key] : 0;
          const attention = check.warn && value > 0;
          return (
            <a key={check.key} href={check.href}>
              <StatCard
                label={check.label}
                value={String(value)}
                delta={attention ? "Needs a look" : "Current"}
                deltaTone={attention ? "warning" : "muted"}
              />
            </a>
          );
        })}
      </div>
      <Panel>
        <h3 className="font-display text-[18px]">What this does not cover</h3>
        <p className="mt-2 type-body-s text-muted-foreground">
          Payment collection and SMS are still off. A failed payout or an undelivered text will not show here until those connections exist.
        </p>
      </Panel>
    </div>
  );
}

export function AuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void fetchAudit(200)
      .then((next) => setRows(next ?? []))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load the audit log"))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <Panel padding="p-0" className="overflow-hidden">
      <ul>
        {rows.map((row, index) => (
          <li key={`${row.at}-${index}`} className="border-t border-border px-5 py-4 first:border-t-0">
            <p className="type-body-s-semibold">{row.action.replaceAll("_", " ")}</p>
            <p className="type-caption text-muted-foreground">
              {row.at} · {row.actor}
            </p>
            <p className="mt-1 type-body-s text-muted-foreground">{detailText(row.detail)}</p>
          </li>
        ))}
      </ul>
      {loaded && rows.length === 0 && (
        <p className="px-5 py-6 type-body-s text-muted-foreground">No admin actions recorded yet.</p>
      )}
    </Panel>
  );
}

function detailText(detail: Record<string, unknown>) {
  const parts = Object.entries(detail ?? {})
    .filter(([, value]) => value !== null && value !== "")
    .map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`);
  return parts.join(" · ") || "No extra detail";
}
