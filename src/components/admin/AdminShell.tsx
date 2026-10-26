import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/site/primitives";
import { ADMIN_USER } from "@/lib/admin-seed";
import { fetchAdminSession } from "@/lib/auth";
import { searchAdmin, type SearchGroup } from "@/lib/command-center";
import { ADMIN_NAV, navKeyFromPath, PAGE_TITLES, type AdminNavKey } from "./nav";
import { AdminIcon, SearchField } from "./ui";

type AdminIdentity = {
  name: string;
  role: string;
  avatar: string;
  headerAvatar: string;
  email?: string | null;
};

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

function AdminSidebar({
  active,
  identity,
}: {
  active: AdminNavKey;
  identity: AdminIdentity;
}) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col bg-primary px-4 pb-5 pt-7 lg:flex">
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
        <Link
          to="/admin/map"
          className="rounded-[14px] bg-primary-raised p-3.5 text-primary-foreground transition-colors hover:bg-primary-raised/80"
        >
          <p className="type-body-s-semibold">Live map</p>
          <p className="type-caption opacity-70">Studios, members and density</p>
        </Link>
        <div className="flex items-center gap-2.5 border-t border-primary-raised pt-4">
          <img
            src={identity.avatar}
            alt=""
            width={36}
            height={36}
            className="size-9 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="truncate type-body-s-semibold text-primary-foreground">{identity.name}</p>
            <p className="type-caption text-gold">{identity.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function HeaderSearch({ placeholder }: { placeholder: string }) {
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      setGroups([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void searchAdmin(text)
        .then(setGroups)
        .catch(() => setGroups([]));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative hidden min-w-0 md:block">
      <SearchField
        placeholder={placeholder}
        value={query}
        onChange={(value) => {
          setQuery(value);
          setOpen(true);
        }}
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute right-0 top-14 z-50 max-h-96 w-[360px] overflow-y-auto rounded-2xl border border-border bg-white p-2 shadow-lg">
          {groups.length === 0 && (
            <p className="px-3 py-3 type-body-s text-muted-foreground">No matches.</p>
          )}
          {groups.map((group) => (
            <div key={group.title} className="py-1">
              <p className="px-3 py-1 type-caption text-muted-foreground">{group.title}</p>
              {group.hits.map((hit) => (
                <a
                  key={hit.href + hit.label}
                  href={hit.href}
                  className="block rounded-xl px-3 py-2 hover:bg-muted"
                  onClick={() => setOpen(false)}
                >
                  <p className="type-body-s-semibold">{hit.label}</p>
                  <p className="type-caption text-muted-foreground">{hit.hint}</p>
                </a>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminTopBar({
  title,
  searchPlaceholder,
  actions,
  identity,
}: {
  title: string;
  searchPlaceholder: string;
  actions?: ReactNode;
  identity: AdminIdentity;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center gap-3 border-b border-border bg-background px-5 lg:h-[88px] lg:gap-3.5 lg:px-10">
      <h1 className="min-w-0 flex-1 font-display text-[22px] leading-[1.2] text-foreground lg:text-[28px]">
        {title}
      </h1>
      <HeaderSearch placeholder={searchPlaceholder} />
      {actions}
      <Link
        to="/admin/settings"
        className="relative flex size-11 items-center justify-center rounded-[22px] border border-border bg-white"
        aria-label="Settings and alerts"
        title="Settings"
      >
        <AdminIcon name="bell" size={22} />
        <img
          src="/images/icons/badge-dot.svg"
          alt=""
          className="absolute left-[26px] top-[9px] size-2"
        />
      </Link>
      <img
        src={identity.headerAvatar}
        alt=""
        width={40}
        height={40}
        className="hidden size-10 rounded-full object-cover lg:block"
        title={identity.email ?? identity.name}
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
  const [identity, setIdentity] = useState<AdminIdentity>(ADMIN_USER);

  useEffect(() => {
    let cancelled = false;
    void fetchAdminSession().then((session) => {
      if (cancelled || !session) return;
      setIdentity({
        name: session.fullName,
        role: session.roleLabel,
        avatar: session.avatarUrl || ADMIN_USER.avatar,
        headerAvatar: session.avatarUrl || ADMIN_USER.headerAvatar,
        email: session.email,
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-dvh w-full bg-background">
      <AdminSidebar active={active} identity={identity} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar
          title={pageTitle}
          searchPlaceholder={SEARCH_PLACEHOLDERS[active] ?? "Search everything"}
          actions={actions}
          identity={identity}
        />
        <div className="flex-1 px-5 pb-28 pt-5 lg:px-10 lg:pb-8 lg:pt-7">
          {children ?? <Outlet />}
        </div>
      </div>
      <AdminTabBar active={active} />
    </div>
  );
}
