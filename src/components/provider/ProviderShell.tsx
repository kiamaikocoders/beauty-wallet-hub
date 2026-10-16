import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";
import { ProviderSidebar } from "./ProviderSidebar";
import { ProviderTabBar } from "./ProviderTabBar";
import { payoutWeek, type PortalData } from "@/lib/provider-portal-data";
import { cn } from "@/lib/utils";

const TITLES: Record<string, string> = {
  "/provider": "Today",
  "/provider/calendar": "Calendar",
  "/provider/check-in": "Check in",
  "/provider/services": "Services",
  "/provider/team": "Team and hours",
  "/provider/earnings": "Earnings",
  "/provider/reviews": "Reviews",
  "/provider/settings": "Settings",
};

export function ProviderShell({
  data,
  children,
  title,
  mobileSub,
  topAction,
  hideSearch,
}: {
  data: PortalData;
  children: ReactNode;
  title?: string;
  mobileSub?: ReactNode;
  topAction?: ReactNode;
  hideSearch?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const pageTitle =
    title ??
    (pathname.startsWith("/provider/bookings/") ? "Booking" : (TITLES[pathname] ?? "Provider"));
  const week = payoutWeek(data.bookings) || 62400;

  return (
    <div className="flex min-h-dvh w-full bg-background text-foreground">
      <ProviderSidebar provider={data.provider} weekPayout={week} active={pathname} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 hidden h-[88px] items-center gap-3 border-b border-border bg-background px-5 lg:flex lg:px-10">
          <h1 className="min-w-0 flex-1 font-display text-[28px] leading-none">{pageTitle}</h1>
          {!hideSearch && (
            <label className="flex h-12 w-[300px] items-center gap-2 rounded-full border border-border bg-card px-4">
              <Search className="size-5 text-muted-foreground" />
              <input
                placeholder="Search bookings or members"
                className="w-full bg-transparent type-body-s outline-none placeholder:text-muted-foreground"
              />
            </label>
          )}
          <button
            type="button"
            className="relative grid size-11 place-items-center rounded-full border border-border bg-card"
            aria-label="Notifications"
          >
            <Bell className="size-[22px]" />
            <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-burgundy" />
          </button>
          {topAction}
          <div
            className="size-10 shrink-0 rounded-full bg-blush bg-cover bg-center"
            style={{ backgroundImage: "url(/images/providers/wanjiku-hero.jpg)" }}
            aria-hidden
          />
        </header>

        <header className="sticky top-0 z-30 border-b border-border bg-background px-5 pt-3 pb-3 lg:hidden">
          <div className="flex items-center gap-3">
            <h1 className="min-w-0 flex-1 font-display text-[28px] leading-none">{pageTitle}</h1>
            <button
              type="button"
              className="grid size-11 place-items-center rounded-full border border-border bg-card"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
            </button>
          </div>
          {mobileSub && <div className="mt-2 type-body-s text-muted-foreground">{mobileSub}</div>}
        </header>

        <main className={cn("flex-1 px-5 pb-28 lg:px-10 lg:pb-10")}>{children}</main>
        <ProviderTabBar active={pathname} />
      </div>
    </div>
  );
}

export function ProviderMoreLinks() {
  const links = [
    { to: "/provider/services", label: "Services" },
    { to: "/provider/team", label: "Team" },
    { to: "/provider/reviews", label: "Reviews" },
    { to: "/provider/settings", label: "Settings" },
  ] as const;
  return (
    <div className="mt-6 grid gap-2 lg:hidden">
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to as "/provider"}
          className="rounded-2xl border border-border bg-card px-4 py-3 type-body-m-medium"
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
