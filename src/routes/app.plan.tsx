import { createFileRoute } from "@tanstack/react-router";
import { TierCard } from "@/components/site/cards";
import { buttonClass, tierName } from "@/components/site/primitives";
import { useMember } from "@/components/app/MemberContext";
import { fetchMemberSession, formatRenews } from "@/lib/app-data";
import { fetchRules } from "@/lib/catalog";
import { DEFAULT_RULES, TIER_ORDER, ksh } from "@/lib/pricing";

export const Route = createFileRoute("/app/plan")({
  validateSearch: (raw: Record<string, unknown>) => ({
    demo: typeof raw["demo"] === "string" ? raw["demo"] : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const [session, rules] = await Promise.all([
      fetchMemberSession(deps.demo ?? null),
      fetchRules().catch(() => DEFAULT_RULES),
    ]);
    return { session, rules };
  },
  component: PlanPage,
});

function PlanPage() {
  const { rules } = Route.useLoaderData();
  const { member } = useMember();
  if (!member) return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="type-eyebrow text-burgundy">Current plan</p>
        <h1 className="mt-2 type-h1">{tierName[member.tier]}</h1>
        <p className="mt-2 type-body-m text-muted-foreground">
          {ksh(member.priceKsh)} a month · {member.monthlyCoins.toLocaleString("en-KE")} coins ·
          renews {formatRenews(member.renewsOn)}
        </p>
        <p className="mt-2 type-body-s">Paid by M-Pesa · {member.phone}</p>
        <p className="mt-4 type-body-s text-muted-foreground">
          Plan changes start at your next renewal on {formatRenews(member.renewsOn)}. Your current
          coins stay usable until then.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {TIER_ORDER.map((tier) => (
          <TierCard
            key={tier}
            tier={tier}
            rules={rules}
            cta={
              tier === member.tier ? (
                <span
                  className={buttonClass({
                    variant: "secondary",
                    full: true,
                    className: "pointer-events-none",
                  })}
                >
                  Your current plan
                </span>
              ) : (
                <button
                  type="button"
                  className={buttonClass({
                    full: true,
                    variant: tier === "premium" ? "gold" : "primary",
                  })}
                >
                  {TIER_ORDER.indexOf(tier) < TIER_ORDER.indexOf(member.tier)
                    ? `Switch to ${tierName[tier]}`
                    : `Upgrade to ${tierName[tier]}`}
                </button>
              )
            }
          />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="type-h4">Need a break?</h2>
        <button type="button" className={buttonClass({ variant: "ghost", className: "mt-2" })}>
          Cancel your plan
        </button>
      </div>
    </div>
  );
}
