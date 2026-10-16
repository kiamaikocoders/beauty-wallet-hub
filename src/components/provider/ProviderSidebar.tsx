import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/site/primitives";
import { ksh, type PortalProvider } from "@/lib/provider-portal-data";
import { tierLabel } from "@/lib/provider-portal-data";

const NAV: { to: string; label: string; exact?: boolean }[] = [
  { to: "/provider", label: "Today", exact: true },
  { to: "/provider/calendar", label: "Calendar" },
  { to: "/provider/check-in", label: "Check in" },
  { to: "/provider/services", label: "Services" },
  { to: "/provider/team", label: "Team" },
  { to: "/provider/earnings", label: "Earnings" },
  { to: "/provider/reviews", label: "Reviews" },
  { to: "/provider/settings", label: "Settings" },
];

export function ProviderSidebar({
  provider,
  weekPayout,
  active,
}: {
  provider: PortalProvider;
  weekPayout: number;
  active: string;
}) {
  return (
    <aside className="hidden h-dvh w-[264px] shrink-0 flex-col bg-primary text-primary-foreground lg:flex">
      <div className="px-6 pt-7 pb-6">
        <Logo tone="light" />
        <p className="mt-1 type-body-s text-gold">Provider</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 px-3" aria-label="Provider">
        {NAV.map((item) => {
          const isActive = item.exact
            ? active === item.to
            : active === item.to || active.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              to={item.to as "/provider"}
              className={cn(
                "rounded-xl px-4 py-2.5 type-body-m-medium transition-colors",
                isActive
                  ? "bg-primary-foreground/12 text-primary-foreground"
                  : "text-primary-foreground/70 hover:bg-primary-foreground/8 hover:text-primary-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mx-3 mb-3 rounded-2xl bg-primary-foreground/8 px-4 py-4">
        <p className="type-body-s text-primary-foreground/65">Next payout · Tue 13 Oct</p>
        <p className="mt-1 type-body-m-medium">{ksh(weekPayout || 62400)} to M-Pesa till</p>
      </div>
      <div className="border-t border-primary-foreground/10 px-6 py-5">
        <p className="type-body-m-medium">{provider.name}</p>
        <p className="mt-0.5 type-body-s text-primary-foreground/65">
          {tierLabel(provider.class)} class
        </p>
      </div>
    </aside>
  );
}
