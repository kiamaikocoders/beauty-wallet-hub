import { Link, createFileRoute } from "@tanstack/react-router";
import { useMember } from "@/components/app/MemberContext";
import { Icon, TierBadge, buttonClass, tierName } from "@/components/site/primitives";
import { formatRenews } from "@/lib/app-data";

export const Route = createFileRoute("/app/profile")({
  validateSearch: (raw: Record<string, unknown>) => ({
    demo: typeof raw["demo"] === "string" ? raw["demo"] : undefined,
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { member, demo } = useMember();
  if (!member) return null;
  const since = new Date(member.createdAt).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });

  const rows: { label: string; meta: string; to?: string; href?: string }[] = [
    { label: "Personal details", meta: "Name, phone, email" },
    { label: "Payment methods", meta: `M-Pesa ${member.phone} · card ending 7710` },
    {
      label: "Plan",
      meta: `${tierName[member.tier]} · renews ${formatRenews(member.renewsOn)}`,
      to: "/app/plan",
    },
    { label: "Services and areas", meta: `${member.area ?? "Nairobi"}` },
    { label: "Notifications", meta: "SMS reminders on", to: "/app/notifications" },
    { label: "Security and devices", meta: "Phone code sign-in · 2 devices" },
    { label: "Help centre", meta: "Chat, call or email us", href: "/help" },
    { label: "Legal", meta: "Terms, privacy, coin policy", href: "/legal/terms" },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-4">
        <img src={member.avatarUrl} alt="" className="size-20 rounded-full object-cover" />
        <div>
          <h1 className="type-h2">{member.fullName}</h1>
          <p className="type-body-s text-muted-foreground">
            {member.phone}
            {member.email ? ` · ${member.email}` : ""}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <TierBadge tier={member.tier} />
            <span className="type-caption text-muted-foreground">Member since {since}</span>
          </div>
        </div>
      </div>

      <h2 className="mt-10 type-eyebrow text-burgundy">Account</h2>
      <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
        {rows.map((r) => (
          <li key={r.label}>
            {r.to ? (
              <Link
                to={r.to as "/app/plan"}
                search={(demo ? { demo } : {}) as never}
                className="flex items-center justify-between gap-3 px-4 py-4"
              >
                <span>
                  <span className="block type-body-s-semibold">{r.label}</span>
                  <span className="type-caption text-muted-foreground">{r.meta}</span>
                </span>
                <Icon name="chevron-right" size={18} />
              </Link>
            ) : (
              <a href={r.href ?? "#"} className="flex items-center justify-between gap-3 px-4 py-4">
                <span>
                  <span className="block type-body-s-semibold">{r.label}</span>
                  <span className="type-caption text-muted-foreground">{r.meta}</span>
                </span>
                <Icon name="chevron-right" size={18} />
              </a>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-8 space-y-3">
        <Toggle
          label="Booking reminders by SMS"
          meta="A text the day before and an hour before"
          defaultChecked
        />
        <Toggle
          label="Coins and renewal alerts"
          meta="Low balance, rollover and renewal dates"
          defaultChecked
        />
        <Toggle label="Offers from providers" meta="New services and quiet-hour deals" />
        <Toggle label="Weekly picks by email" meta="Services we think you’ll like" defaultChecked />
      </div>

      <div className="mt-8">
        <a href="/sign-in" className={buttonClass({ variant: "ghost" })}>
          Sign out
        </a>
      </div>
    </div>
  );
}

function Toggle({
  label,
  meta,
  defaultChecked,
}: {
  label: string;
  meta: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3">
      <span>
        <span className="block type-body-s-semibold">{label}</span>
        <span className="type-caption text-muted-foreground">{meta}</span>
      </span>
      <input type="checkbox" defaultChecked={defaultChecked} className="size-5" />
    </label>
  );
}
