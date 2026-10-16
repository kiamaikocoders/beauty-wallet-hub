import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  CircleDollarSign,
  ClipboardCheck,
  LayoutGrid,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS: {
  to: string;
  label: string;
  icon: typeof LayoutGrid;
  exact?: boolean;
  more?: boolean;
}[] = [
  { to: "/provider", label: "Today", icon: LayoutGrid, exact: true },
  { to: "/provider/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/provider/check-in", label: "Check in", icon: ClipboardCheck },
  { to: "/provider/earnings", label: "Earnings", icon: CircleDollarSign },
  { to: "/provider/services", label: "More", icon: MoreHorizontal, more: true },
];

export function ProviderTabBar({ active }: { active: string }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Provider tabs"
    >
      <div className="grid h-[72px] grid-cols-5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const moreActive =
            tab.more &&
            [
              "/provider/services",
              "/provider/team",
              "/provider/reviews",
              "/provider/settings",
            ].some((p) => active === p || active.startsWith(`${p}/`));
          const isActive = tab.exact
            ? active === tab.to
            : tab.more
              ? moreActive
              : active === tab.to || active.startsWith(`${tab.to}/`);
          return (
            <Link
              key={tab.to}
              to={tab.to as "/provider"}
              className={cn(
                "flex flex-col items-center justify-center gap-1 type-body-s",
                isActive ? "text-burgundy" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" strokeWidth={isActive ? 2.25 : 1.75} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
