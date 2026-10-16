import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/site/primitives";
import { ADMIN_USER, OVERVIEW } from "@/lib/admin-seed";
import { ADMIN_NAV, navKeyFromPath, PAGE_TITLES, type AdminNavKey } from "./nav";
import { AdminIcon, SearchField } from "./ui";

function SidebarItem({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link
      to={href}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2.5 type-body-s-medium transition-colors",
        active
          ? "bg-primary-raised text-primary-foreground"
          : "text-gold hover:bg-primary-raised/60",
      )}
    >
      <AdminIcon name={icon} size={20} />
      <span>{label}</span>
    </Link>
  );
}

function AdminSidebar({ active }: { active: AdminNavKey }) {
  return (
    <aside className="hidden h-dvh w-[264px] shrink-0 flex-col bg-primary px-4 pb-5 pt-7 lg:flex">
      <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-hidden">
        <div className="flex shrink-0 flex-col gap-1.5 pl-2">
          <Logo tone="light" />
          <p className="type-eyebrow text-gold">Admin</p>
        </div>
        <nav className="flex min-h-0 w-full flex-1 flex-col gap-1 overflow-y-auto">
          {ADMIN_NAV.map((item) => (
            <SidebarItem
              key={item.key}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={active === item.key}
            />
          ))}
        </nav>
      </div>
      <div className="mt-4 flex w-full shrink-0 flex-col gap-4">
        <div className="rounded-[14px] bg-primary-raised p-3.5 text-primary-foreground">
          <p className="type-body-s-semibold">Margin this month</p>
          <p className="type-caption opacity-70">
            {OVERVIEW.marginPct} · {OVERVIEW.marginWarning}
          </p>
        </div>
        <div className="flex items-center gap-2.5 border-t border-primary-raised pt-4">
          <img
            src={ADMIN_USER.avatar}
            alt=""
            width={36}
            height={36}
            className="size-9 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="type-body-s-semibold text-primary-foreground">{ADMIN_USER.name}</p>
            <p className="type-caption text-gold">{ADMIN_USER.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function AdminTopBar({
  title,
  searchPlaceholder,
  actions,
}: {
  title: string;
  searchPlaceholder: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex h-[72px] shrink-0 items-center gap-3 border-b border-border px-5 lg:h-[88px] lg:gap-3.5 lg:px-10">
      <h1 className="min-w-0 flex-1 font-display text-[22px] leading-[1.2] text-foreground lg:text-[28px]">
        {title}
      </h1>
      <SearchField placeholder={searchPlaceholder} className="hidden lg:flex" />
      {actions}
      <button
        type="button"
        className="relative flex size-11 items-center justify-center rounded-[22px] border border-border bg-white"
        aria-label="Notifications"
      >
        <AdminIcon name="bell" size={22} />
        <img
          src="/images/icons/badge-dot.svg"
          alt=""
          className="absolute left-[26px] top-[9px] size-2"
        />
      </button>
      <img
        src={ADMIN_USER.headerAvatar}
        alt=""
        width={40}
        height={40}
        className="hidden size-10 rounded-full object-cover lg:block"
      />
    </header>
  );
}

function AdminTabBar({ active }: { active: AdminNavKey }) {
  const primary = ADMIN_NAV.filter((n) => n.mobilePrimary);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreItems = ADMIN_NAV.filter((n) => !n.mobilePrimary);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-[100px] items-start justify-around border-t border-border bg-card px-2 pt-2 pb-[env(safe-area-inset-bottom)] lg:hidden">
        {primary.map((item) => {
          const isActive = active === item.key;
          return (
            <Link
              key={item.key}
              to={item.href}
              className="flex min-h-11 min-w-[64px] flex-col items-center gap-1 px-2 py-2"
            >
              <AdminIcon
                name={item.icon}
                size={24}
                className={isActive ? "opacity-100" : "opacity-60"}
              />
              <span
                className={cn(
                  "type-caption",
                  isActive ? "font-semibold text-burgundy" : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="flex min-h-11 min-w-[64px] flex-col items-center gap-1 px-2 py-2"
        >
          <AdminIcon name="menu" size={24} className="opacity-60" />
          <span className="type-caption text-muted-foreground">More</span>
        </button>
      </nav>
      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40"
            aria-label="Close"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[24px] border border-border bg-card px-5 pb-8 pt-5">
            <p className="type-eyebrow text-burgundy">More</p>
            <div className="mt-4 grid gap-1">
              {moreItems.map((item) => (
                <Link
                  key={item.key}
                  to={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex min-h-11 items-center gap-3 rounded-md px-3 py-3 type-body-m-medium text-foreground hover:bg-muted"
                >
                  <AdminIcon name={item.icon} size={20} />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const SEARCH_PLACEHOLDERS: Partial<Record<AdminNavKey, string>> = {
  overview: "Search everything",
  rates: "Search everything",
  providers: "Search providers",
  members: "Search members",
  gifts: "Search gifts or phone numbers",
  companies: "Search companies",
  bookings: "Search bookings",
  disputes: "Search disputes",
  payouts: "Search providers",
  finance: "Search everything",
  settings: "Search everything",
};

export function AdminShell({
  title,
  actions,
  children,
}: {
  title?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = navKeyFromPath(pathname);
  const pageTitle = title ?? PAGE_TITLES[active];

  return (
    <div className="flex min-h-dvh w-full bg-background">
      <AdminSidebar active={active} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar
          title={pageTitle}
          searchPlaceholder={SEARCH_PLACEHOLDERS[active] ?? "Search everything"}
          actions={actions}
        />
        <div className="flex-1 overflow-y-auto px-5 pb-28 pt-5 lg:px-10 lg:pb-8 lg:pt-7">
          {children ?? <Outlet />}
        </div>
      </div>
      <AdminTabBar active={active} />
    </div>
  );
}
