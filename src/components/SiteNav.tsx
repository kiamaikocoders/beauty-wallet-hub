import { Link } from "@tanstack/react-router";
import { Wallet } from "lucide-react";

const roles = [
  { to: "/", label: "Public" },
  { to: "/app", label: "Subscriber" },
  { to: "/provider", label: "Provider" },
  { to: "/admin", label: "Admin" },
] as const;

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground"><Wallet className="h-4 w-4" /></span>
          <span className="font-display text-2xl leading-none">Beauty Wallet</span>
        </Link>
        <nav aria-label="Demo role switcher" className="flex items-center gap-1 rounded-full border bg-card p-1 text-xs sm:text-sm">
          <span className="hidden px-2 text-muted-foreground md:inline">View as</span>
          {roles.map((r) => (
            <Link key={r.to} to={r.to} activeOptions={{ exact: true }}
              className="rounded-full px-3 py-1.5 text-muted-foreground transition hover:text-foreground"
              activeProps={{ className: "bg-primary !text-primary-foreground" }}>
              {r.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function TierBadge({ tier }: { tier: string }) {
  return <span className="rounded-full border border-gold/60 bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-foreground">{tier}</span>;
}
