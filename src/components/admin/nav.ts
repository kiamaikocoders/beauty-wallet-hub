export type AdminNavKey =
  | "overview"
  | "rates"
  | "providers"
  | "members"
  | "gifts"
  | "companies"
  | "bookings"
  | "disputes"
  | "payouts"
  | "finance"
  | "settings";

export const ADMIN_NAV: {
  key: AdminNavKey;
  label: string;
  href: string;
  icon: string;
  mobilePrimary?: boolean;
}[] = [
  { key: "overview", label: "Overview", href: "/admin", icon: "home-admin", mobilePrimary: true },
  { key: "rates", label: "Rate bands", href: "/admin/rates", icon: "percent" },
  {
    key: "providers",
    label: "Providers",
    href: "/admin/providers",
    icon: "store",
    mobilePrimary: true,
  },
  { key: "members", label: "Members", href: "/admin/members", icon: "users" },
  { key: "gifts", label: "Gifts", href: "/admin/gifts", icon: "gift" },
  { key: "companies", label: "Companies", href: "/admin/companies", icon: "building" },
  { key: "bookings", label: "Bookings", href: "/admin/bookings", icon: "calendar-admin" },
  {
    key: "disputes",
    label: "Disputes",
    href: "/admin/disputes",
    icon: "flag",
    mobilePrimary: true,
  },
  {
    key: "payouts",
    label: "Payouts",
    href: "/admin/payouts",
    icon: "banknote",
    mobilePrimary: true,
  },
  { key: "finance", label: "Finance", href: "/admin/finance", icon: "bar-chart" },
  { key: "settings", label: "Settings", href: "/admin/settings", icon: "settings-admin" },
];

export function navKeyFromPath(pathname: string): AdminNavKey {
  if (pathname.startsWith("/admin/rates")) return "rates";
  if (pathname.startsWith("/admin/providers")) return "providers";
  if (pathname.startsWith("/admin/members")) return "members";
  if (pathname.startsWith("/admin/gifts")) return "gifts";
  if (pathname.startsWith("/admin/companies")) return "companies";
  if (pathname.startsWith("/admin/bookings")) return "bookings";
  if (pathname.startsWith("/admin/disputes")) return "disputes";
  if (pathname.startsWith("/admin/payouts")) return "payouts";
  if (pathname.startsWith("/admin/finance")) return "finance";
  if (pathname.startsWith("/admin/settings")) return "settings";
  return "overview";
}

export function statusTone(status: string): "success" | "warning" | "error" | "info" | "neutral" {
  const s = status.toLowerCase();
  if (
    s.includes("live") ||
    s.includes("active") ||
    s.includes("ready") ||
    s.includes("claimed") ||
    s.includes("done") ||
    s.includes("paid")
  )
    return "success";
  if (
    s.includes("overdue") ||
    s.includes("failed") ||
    s.includes("hold") ||
    s.includes("paused") ||
    s.includes("lose") ||
    s.includes("under")
  )
    return "error";
  if (
    s.includes("new") ||
    s.includes("waiting") ||
    s.includes("scheduled") ||
    s.includes("arriving") ||
    s.includes("progress") ||
    s.includes("setting")
  )
    return "warning";
  if (s.includes("dispute") || s.includes("open")) return "info";
  return "neutral";
}

export const PAGE_TITLES: Record<AdminNavKey, string> = {
  overview: "Overview",
  rates: "Rate bands",
  providers: "Providers",
  members: "Members",
  gifts: "Gifts",
  companies: "Companies",
  bookings: "Bookings",
  disputes: "Disputes",
  payouts: "Payouts",
  finance: "Finance",
  settings: "Settings",
};
