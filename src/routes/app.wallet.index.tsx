import { Link, createFileRoute } from "@tanstack/react-router";
import { WalletCard } from "@/components/site/cards";
import { buttonClass } from "@/components/site/primitives";
import { useMember } from "@/components/app/MemberContext";
import { BottomSheet } from "@/components/app/Sheets";
import { coinsLabel, fetchMemberWallet, formatRenews } from "@/lib/app-data";
import { fetchRules } from "@/lib/catalog";
import { DEFAULT_RULES, ksh, num } from "@/lib/pricing";
import { useState } from "react";

export const Route = createFileRoute("/app/wallet/")({
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const [wallet, rules] = await Promise.all([
      fetchMemberWallet(deps.demo ?? null),
      fetchRules().catch(() => DEFAULT_RULES),
    ]);
    return { wallet, rules, success: Boolean(deps.success) };
  },
  component: WalletPage,
});

function WalletPage() {
  const { wallet, rules, success } = Route.useLoaderData();
  const { member, demo } = useMember();
  const [filter, setFilter] = useState<"all" | "added" | "spent" | "held">("all");
  const [successOpen, setSuccessOpen] = useState(success);

  if (!member || !wallet) return null;
  const m = wallet.member;
  const ledger = (wallet.ledger ?? []).filter((t) => {
    if (filter === "added") return t.coins > 0;
    if (filter === "spent") return t.kind === "release" || (t.coins < 0 && t.kind !== "hold");
    if (filter === "held") return t.kind === "hold";
    return true;
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <WalletCard
          tier={m.tier}
          coins={num(m.wallet.available)}
          value={`≈ ${ksh(m.wallet.available * rules.kshPerCoin)} in service value`}
          onHold={coinsLabel(m.wallet.onHold)}
          rollover={coinsLabel(Math.round(m.wallet.available * rules.rolloverPct))}
          rolloverLabel={`Rolls over (${Math.round(rules.rolloverPct * 100)}%)`}
          renews={formatRenews(m.renewsOn)}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat
            label="Spent this month"
            value={coinsLabel(wallet.spentThisMonth)}
            sub={`${ksh(wallet.spentThisMonth * rules.kshPerCoin)} in services`}
          />
          <Stat label="Topped up" value={coinsLabel(wallet.toppedUpThisMonth)} sub="This month" />
          <Stat label="Rolled over" value={coinsLabel(m.wallet.rollover)} sub="From last month" />
        </div>
      </div>

      <p className="type-body-s text-muted-foreground">
        On {formatRenews(m.renewsOn)}, {Math.round(rules.rolloverPct * 100)}% of whatever is unused
        rolls over and the other {Math.round((1 - rules.rolloverPct) * 100)}% is taken back. Right
        now that would be {coinsLabel(Math.round(m.wallet.available * rules.rolloverPct))}.
      </p>

      <div className="flex flex-wrap gap-2">
        <Link
          to="/app/wallet/top-up"
          search={(demo ? { demo } : {}) as never}
          className={buttonClass()}
        >
          Top up coins
        </Link>
        <Link
          to="/app/plan"
          search={(demo ? { demo } : {}) as never}
          className={buttonClass({ variant: "secondary" })}
        >
          Change plan
        </Link>
      </div>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="type-h3">October activity</h2>
          <div className="flex gap-1 rounded-full bg-muted p-1">
            {(["all", "added", "spent", "held"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 type-caption capitalize ${filter === f ? "bg-card shadow-soft" : ""}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
          {ledger.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate type-body-s-semibold">{t.note ?? t.kind}</p>
                <p className="type-caption capitalize text-muted-foreground">
                  {t.kind} ·{" "}
                  {new Date(t.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </p>
              </div>
              <p className="type-body-s-semibold">
                {t.kind === "hold"
                  ? `${Math.abs(t.coins)} held`
                  : t.coins > 0
                    ? `+${t.coins}`
                    : String(t.coins)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <BottomSheet open={successOpen} onClose={() => setSuccessOpen(false)}>
        <p className="type-eyebrow text-burgundy">Top up</p>
        <h2 className="mt-2 type-h2">Coins added</h2>
        <p className="mt-2 type-body-s text-muted-foreground">Your receipt is on its way by SMS.</p>
        <div className="mt-5 space-y-2 rounded-xl bg-muted p-4 type-body-s">
          <div className="flex justify-between">
            <span>Available now</span>
            <span className="type-body-s-semibold">{coinsLabel(m.wallet.available)}</span>
          </div>
        </div>
        <Link
          to="/app/wallet"
          search={(demo ? { demo } : {}) as never}
          className={buttonClass({ full: true, className: "mt-5" })}
          onClick={() => setSuccessOpen(false)}
        >
          Back to wallet
        </Link>
        <Link
          to="/app/explore"
          search={(demo ? { demo } : {}) as never}
          className={buttonClass({ variant: "ghost", full: true, className: "mt-2" })}
        >
          Book a visit
        </Link>
      </BottomSheet>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="type-caption text-muted-foreground">{label}</p>
      <p className="mt-1 type-h3">{value}</p>
      <p className="type-caption text-muted-foreground">{sub}</p>
    </div>
  );
}
