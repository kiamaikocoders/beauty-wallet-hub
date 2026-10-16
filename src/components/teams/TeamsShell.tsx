import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Icon, TierBadge, buttonClass } from "@/components/site/primitives";
import { TEAMS_DEMO, setTeamsHrSession } from "@/lib/teams-demo";
import { ksh } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const NAV: {
  to: "/teams" | "/teams/staff" | "/teams/invoices" | "/teams/settings";
  label: string;
  icon: string;
  end?: boolean;
}[] = [
  { to: "/teams", label: "Overview", icon: "home", end: true },
  { to: "/teams/staff", label: "Staff", icon: "users" },
  { to: "/teams/invoices", label: "Invoices", icon: "file-text" },
  { to: "/teams/settings", label: "Settings", icon: "settings" },
];

function initialsAvatar(initials: string, className?: string) {
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-blush type-caption text-foreground",
        className,
      )}
    >
      {initials}
    </span>
  );
}

export function TeamsShell({
  title,
  children,
  onInvite,
  searchPlaceholder = "Search staff",
}: {
  title: string;
  children: ReactNode;
  onInvite?: (() => void) | undefined;
  searchPlaceholder?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-dvh w-full bg-background">
      <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col justify-between bg-primary px-4 pb-5 pt-7 text-primary-foreground lg:flex">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-1.5 pl-2">
            <div className="flex items-center gap-2.5">
              <img src="/images/brand/emblem-on-dark.svg" alt="" width={34} height={34} />
              <span className="font-display text-[18px] tracking-[-0.18px]">Beauty Wallet</span>
            </div>
            <p className="type-eyebrow text-gold">Teams</p>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = item.end
                ? pathname === "/teams" || pathname === "/teams/"
                : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 type-body-s transition-colors",
                    active
                      ? "bg-primary-raised font-semibold text-primary-foreground"
                      : "text-primary-foreground/70 hover:bg-primary-raised/60 hover:text-primary-foreground",
                  )}
                >
                  <Icon name={item.icon} size={20} className="opacity-90" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-primary-raised px-4 py-3">
            <p className="type-caption text-primary-foreground/70">
              Next invoice · {TEAMS_DEMO.nextInvoiceDate}
            </p>
            <p className="type-body-s-medium mt-1">
              {ksh(TEAMS_DEMO.nextInvoiceKsh)} · {TEAMS_DEMO.seats} seats
            </p>
          </div>
          <div className="flex items-center gap-3 pl-1">
            {initialsAvatar("LN", "bg-blush text-foreground")}
            <div>
              <p className="type-body-s-medium">{TEAMS_DEMO.hrName}</p>
              <p className="type-caption text-primary-foreground/60">{TEAMS_DEMO.hrTitle}</p>
            </div>
          </div>
          <button
            type="button"
            className="type-caption text-left text-primary-foreground/50 hover:text-primary-foreground"
            onClick={() => {
              setTeamsHrSession(false);
              window.location.href = "/teams";
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background">
          <div className="flex flex-wrap items-center gap-3 px-5 py-4 lg:px-8">
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <h1 className="type-h2 shrink-0 text-foreground">{title}</h1>
              <label
                className="flex min-h-11 flex-1 cursor-not-allowed items-center gap-2 rounded-full bg-muted px-4 opacity-70"
                title="Search is not connected yet"
              >
                <Icon name="search" size={18} />
                <input
                  className="w-full cursor-not-allowed bg-transparent type-body-m outline-none placeholder:text-muted-foreground"
                  placeholder={searchPlaceholder}
                  readOnly
                  aria-disabled
                />
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/teams/settings"
                className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-card"
                aria-label="Settings"
                title="Settings"
              >
                <Icon name="bell" size={20} />
              </Link>
              {onInvite ? (
                <button
                  type="button"
                  onClick={onInvite}
                  className={buttonClass({ variant: "emphasis", size: "s" })}
                >
                  Invite staff
                </button>
              ) : (
                <Link
                  to="/teams/staff"
                  search={{ invite: "1" }}
                  className={buttonClass({ variant: "emphasis", size: "s" })}
                >
                  Invite staff
                </Link>
              )}
              {initialsAvatar("LN", "hidden sm:inline-flex")}
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-5 pb-2 lg:hidden">
            {NAV.map((item) => {
              const active = item.end
                ? pathname === "/teams" || pathname === "/teams/"
                : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "rounded-full px-3 py-2 type-body-s whitespace-nowrap",
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="flex-1 px-5 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

export function StatTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="type-caption text-muted-foreground">{label}</p>
      <p className="type-stat mt-1.5 text-foreground">{value}</p>
      <p className="type-caption mt-1.5 text-muted-foreground">{sub}</p>
    </div>
  );
}

export function TierProgress({
  tier,
  seats,
  monthly,
  used,
  total,
}: {
  tier: "basic" | "intermediate" | "premium";
  seats: number;
  monthly: string;
  used: number;
  total: number;
}) {
  const pct = total ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TierBadge tier={tier} />
          <span className="type-body-s text-muted-foreground">{seats} seats</span>
        </div>
        <span className="type-body-s-medium">{monthly}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-burgundy" style={{ width: `${pct}%` }} />
      </div>
      <p className="type-caption text-muted-foreground">
        {used.toLocaleString("en-KE")} of {total.toLocaleString("en-KE")} coins used
      </p>
    </div>
  );
}

export { initialsAvatar };
