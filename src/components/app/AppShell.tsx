import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Logo, Icon, CoinChip, buttonClass, tierName } from "@/components/site/primitives";
import { cn } from "@/lib/utils";
import { coinsLabel, formatRenews, type MemberSession } from "@/lib/app-data";
import { useMember } from "./MemberContext";

export type AppNavId =
  "home" | "explore" | "bookings" | "wallet" | "plan" | "notifications" | "profile";

const SIDEBAR: { id: AppNavId; label: string; to: string; icon: string; iconActive: string }[] = [
  { id: "home", label: "Home", to: "/app", icon: "home-gold", iconActive: "home" },
  {
    id: "explore",
    label: "Explore",
    to: "/app/explore",
    icon: "search-gold",
    iconActive: "search-light",
  },
  {
    id: "bookings",
    label: "Bookings",
    to: "/app/bookings",
    icon: "calendar-gold",
    iconActive: "calendar",
  },
  { id: "wallet", label: "Wallet", to: "/app/wallet", icon: "wallet-gold", iconActive: "wallet" },
  { id: "plan", label: "Plan", to: "/app/plan", icon: "layers-gold", iconActive: "layers" },
  {
    id: "notifications",
    label: "Notifications",
    to: "/app/notifications",
    icon: "bell-gold",
    iconActive: "bell",
  },
  { id: "profile", label: "Profile", to: "/app/profile", icon: "user-gold", iconActive: "user" },
];

const TABS: { id: AppNavId; label: string; to: string; icon: string }[] = [
  { id: "home", label: "Home", to: "/app", icon: "home" },
  { id: "explore", label: "Explore", to: "/app/explore", icon: "search" },
  { id: "bookings", label: "Bookings", to: "/app/bookings", icon: "calendar" },
  { id: "wallet", label: "Wallet", to: "/app/wallet", icon: "wallet" },
  { id: "profile", label: "Profile", to: "/app/profile", icon: "user" },
];

function activeFromPath(pathname: string): AppNavId {
  if (pathname.startsWith("/app/bookings")) return "bookings";
  if (pathname.startsWith("/app/wallet")) return "wallet";
  if (pathname.startsWith("/app/plan")) return "plan";
  if (pathname.startsWith("/app/notifications")) return "notifications";
  if (pathname.startsWith("/app/profile")) return "profile";
  if (
    pathname.startsWith("/app/explore") ||
    pathname.startsWith("/app/p/") ||
    pathname.startsWith("/app/book")
  )
    return "explore";
  return "home";
}

function titleFromPath(pathname: string): string {
  if (pathname.startsWith("/app/book/done")) return "Bookings";
  if (pathname.startsWith("/app/book")) return "Book";
  if (pathname.startsWith("/app/bookings")) return "Bookings";
  if (pathname.startsWith("/app/wallet")) return "Wallet";
  if (pathname.startsWith("/app/plan")) return "Plan";
  if (pathname.startsWith("/app/notifications")) return "Notifications";
  if (pathname.startsWith("/app/profile")) return "Profile";
  if (pathname.startsWith("/app/explore") || pathname.startsWith("/app/p/")) return "Explore";
  return "Home";
}

function withDemo(to: string, demo: string | null) {
  return demo ? { to, search: { demo } as never } : { to };
}

export function AppShell() {
  const { member, demo } = useMember();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = activeFromPath(pathname);
  const title = titleFromPath(pathname);

  if (!member) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-5">
        <Logo tone="dark" />
        <h1 className="mt-8 type-h1 text-foreground">Sign in to your wallet</h1>
        <p className="mt-3 max-w-md text-center type-body-m text-muted-foreground">
          Sign in with the email and password on your Beauty Wallet account.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="/sign-in" className={buttonClass({ variant: "emphasis" })}>
            Sign in
          </a>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col justify-between bg-primary px-4 pb-5 pt-7 lg:flex">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-1.5 pl-2">
            <Logo tone="light" />
            <p className="type-eyebrow text-gold">Member</p>
          </div>
          <nav className="flex flex-col gap-1">
            {SIDEBAR.map((item) => {
              const on = active === item.id;
              return (
                <Link
                  key={item.id}
                  {...withDemo(item.to, demo)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 type-body-s-medium transition-colors",
                    on
                      ? "bg-primary-raised text-primary-foreground"
                      : "text-gold hover:bg-primary-raised/50",
                  )}
                >
                  <Icon name={on ? item.iconActive : item.icon} size={20} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <SidebarFooter member={member} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between gap-3 border-b border-border bg-background px-5 lg:h-[88px] lg:px-10">
          <h1 className="type-h3 lg:type-h2 text-foreground">{title}</h1>
          <div className="flex items-center gap-2 lg:gap-3">
            <label className="hidden items-center gap-2 rounded-full border border-border bg-card px-4 py-2 md:flex">
              <Icon name="search" size={20} />
              <input
                placeholder="Search services"
                className="w-48 bg-transparent type-body-s outline-none placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const q = (e.target as HTMLInputElement).value;
                    window.location.href = `/app/explore?q=${encodeURIComponent(q)}${demo ? `&demo=${demo}` : ""}`;
                  }
                }}
              />
            </label>
            <Link
              {...withDemo("/app/notifications", demo)}
              className="relative flex size-11 items-center justify-center rounded-full border border-border bg-card"
              aria-label="Notifications"
            >
              <Icon name="bell" size={22} />
              <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-burgundy" />
            </Link>
            <CoinChip className="hidden sm:inline-flex">
              {coinsLabel(member.wallet.available)}
            </CoinChip>
            <Link
              {...withDemo("/app/profile", demo)}
              className="size-10 overflow-hidden rounded-full bg-muted"
            >
              <img src={member.avatarUrl} alt="" className="size-full object-cover" />
            </Link>
          </div>
        </header>
        <div className="w-full flex-1 px-5 py-5 lg:px-10 lg:py-7">
          <Outlet />
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card px-2 pb-[env(safe-area-inset-bottom)] pt-1 lg:hidden">
        {TABS.map((item) => {
          const on = active === item.id;
          return (
            <Link
              key={item.id}
              {...withDemo(item.to, demo)}
              className={cn(
                "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 type-caption",
                on ? "text-burgundy" : "text-muted-foreground",
              )}
            >
              <Icon name={item.icon} size={22} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function SidebarFooter({ member }: { member: MemberSession }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[14px] bg-primary-raised p-3.5 text-primary-foreground">
        <p className="type-body-s-semibold">{tierName[member.tier]} plan</p>
        <p className="type-caption opacity-70">
          Renews {formatRenews(member.renewsOn)} ·{" "}
          {coinsLabel(member.monthlyCoins).replace(" coins", "")} coins
        </p>
      </div>
      <div className="flex items-center gap-2.5 border-t border-primary-raised pt-4">
        <img src={member.avatarUrl} alt="" className="size-9 rounded-full object-cover" />
        <div className="min-w-0">
          <p className="truncate type-body-s-semibold text-primary-foreground">{member.fullName}</p>
          <p className="type-caption text-gold">{member.area}</p>
        </div>
      </div>
    </div>
  );
}
