import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { Stat, TierBadge } from "@/components/SiteNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { SERVICES, actions, useStore } from "@/lib/store";
import { TIER_ORDER, ksh, type CoinRules, type TierId } from "@/lib/pricing";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Control Tower — Beauty Wallet Admin" },
      { name: "description", content: "Operations, vendor vetting, coin rules and payouts." },
      { property: "og:title", content: "Control Tower — Beauty Wallet Admin" },
      { property: "og:description", content: "Run Beauty Wallet: MRR, vendors, coin rules, payouts and disputes." },
    ],
  }),
  component: Admin,
});

const SUBS: Record<TierId, number> = { basic: 212, intermediate: 138, premium: 47 };

function Admin() {
  const rules = useStore((s) => s.rules);
  const vendors = useStore((s) => s.vendors);
  const bookings = useStore((s) => s.bookings);
  const [draft, setDraft] = useState<CoinRules>(rules);
  const [paid, setPaid] = useState(false);

  const mrr = TIER_ORDER.reduce((t, k) => t + SUBS[k] * rules.tiers[k].priceKsh, 0);
  const issued = TIER_ORDER.reduce((t, k) => t + SUBS[k] * rules.tiers[k].monthlyCoins, 0);
  const redeemed = 184_300 + bookings.filter((b) => b.status === "completed").reduce((t, b) => t + b.coins, 0);
  const payouts = vendors.filter((v) => v.status === "active").map((v) => ({
    v, total: 42_000 + bookings.filter((b) => b.vendor === v.name && b.status === "completed").reduce((t, b) => t + b.payoutKsh, 0),
  }));

  const setTier = (k: TierId, f: "priceKsh" | "monthlyCoins" | "discount" | "rolloverPct", val: number) =>
    setDraft({ ...draft, tiers: { ...draft.tiers, [k]: { ...draft.tiers[k], [f]: val } } });

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-4xl">The Control Tower</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active subscribers" value={String(TIER_ORDER.reduce((t, k) => t + SUBS[k], 0))} sub={TIER_ORDER.map((k) => `${rules.tiers[k].name} ${SUBS[k]}`).join(" · ")} />
        <Stat label="MRR" value={ksh(mrr)} />
        <Stat label="Coins issued vs redeemed" value={`${(issued / 1000).toFixed(0)}k / ${(redeemed / 1000).toFixed(0)}k`} sub={`${Math.round((redeemed / issued) * 100)}% redemption`} />
        <Stat label="Active Nairobi vendors" value={String(vendors.filter((v) => v.status === "active").length)} sub={`${vendors.filter((v) => v.status === "pending").length} awaiting vetting`} />
      </div>

      <Tabs defaultValue="vetting" className="mt-10">
        <TabsList className="flex-wrap"><TabsTrigger value="vetting">Vendor vetting</TabsTrigger><TabsTrigger value="rules">Coin rules & tiers</TabsTrigger><TabsTrigger value="payouts">Payout runs</TabsTrigger><TabsTrigger value="live">Bookings & disputes</TabsTrigger></TabsList>

        <TabsContent value="vetting" className="mt-6 space-y-3">
          {vendors.map((v) => (
            <div key={v.id} className="flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-5">
              <div className="min-w-48 flex-1">
                <p className="flex items-center gap-2 font-semibold">{v.name}{v.verified && <BadgeCheck className="h-4 w-4 text-gold-foreground" />}</p>
                <p className="text-sm text-muted-foreground">{v.owner} · {v.area} · applied {v.applied}</p>
                <p className="mt-1 text-xs text-muted-foreground">KYC: {v.kyc.join(", ")} · {v.payoutMethod}</p>
              </div>
              <select value={v.cls} onChange={(e) => actions.updateVendor(v.id, { cls: e.target.value as TierId })} className="rounded-full border bg-background px-3 py-1.5 text-sm">
                {TIER_ORDER.map((t) => <option key={t} value={t}>{rules.tiers[t].name} class</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm">Verified <Switch checked={v.verified} onCheckedChange={(c) => actions.updateVendor(v.id, { verified: c })} /></label>
              {v.status === "pending" ? (
                <div className="flex gap-2">
                  <button onClick={() => { actions.updateVendor(v.id, { status: "active", verified: true }); toast.success(`${v.name} approved`); }} className="rounded-full bg-primary px-4 py-1.5 text-sm text-primary-foreground">Approve</button>
                  <button onClick={() => actions.updateVendor(v.id, { status: "rejected" })} className="rounded-full border px-4 py-1.5 text-sm">Reject</button>
                </div>
              ) : <span className={`text-xs uppercase tracking-wider ${v.status === "active" ? "text-success" : "text-destructive"}`}>{v.status}</span>}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="rules" className="mt-6 space-y-5">
          <div className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-3">
            <Num label="Ksh per coin" v={draft.kshPerCoin} on={(n) => setDraft({ ...draft, kshPerCoin: n })} />
            <Num label="Bundle saving %" v={draft.groupSavings * 100} on={(n) => setDraft({ ...draft, groupSavings: n / 100 })} />
            <Num label="Vendor share %" v={draft.vendorShare * 100} on={(n) => setDraft({ ...draft, vendorShare: n / 100 })} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {TIER_ORDER.map((k) => (
              <div key={k} className="space-y-3 rounded-2xl border bg-card p-5">
                <div className="flex justify-between"><h3 className="text-2xl">{draft.tiers[k].name}</h3><TierBadge tier={k} /></div>
                <Num label="Price (Ksh / mo)" v={draft.tiers[k].priceKsh} on={(n) => setTier(k, "priceKsh", n)} />
                <Num label="Monthly coins" v={draft.tiers[k].monthlyCoins} on={(n) => setTier(k, "monthlyCoins", n)} />
                <Num label="Coin discount %" v={draft.tiers[k].discount * 100} on={(n) => setTier(k, "discount", n / 100)} />
                <Num label="Rollover %" v={draft.tiers[k].rolloverPct * 100} on={(n) => setTier(k, "rolloverPct", n / 100)} />
              </div>
            ))}
          </div>
          <button onClick={() => { actions.setRules(draft); toast.success("Coin rules published"); }} className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">Publish rules</button>
        </TabsContent>

        <TabsContent value="payouts" className="mt-6">
          <div className="overflow-hidden rounded-2xl border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-4">Vendor</th><th>Method</th><th className="text-right">Net payout</th><th className="p-4 text-right">Status</th></tr></thead>
              <tbody>{payouts.map(({ v, total }) => <tr key={v.id} className="border-t"><td className="p-4">{v.name}</td><td>{v.payoutMethod}</td><td className="text-right font-semibold">{ksh(total)}</td><td className="p-4 text-right">{paid ? <span className="text-success">Disbursed</span> : "Ready"}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Batch total: <b className="text-foreground">{ksh(payouts.reduce((t, p) => t + p.total, 0))}</b> · weekly run</p>
            <button disabled={paid} onClick={() => { setPaid(true); toast.success("Payout batch sent to M-Pesa / bank (demo)"); }} className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">Run payout batch</button>
          </div>
        </TabsContent>

        <TabsContent value="live" className="mt-6 space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 ${b.status === "disputed" ? "border-destructive" : ""}`}>
              <div><p className="font-semibold">{b.customer} → {b.vendor}</p><p className="text-sm text-muted-foreground">{SERVICES.filter((s) => b.serviceIds.includes(s.id)).map((s) => s.name).join(" + ")} · {b.when} · {b.coins} coins</p></div>
              {b.status === "disputed" ? (
                <div className="flex gap-2">
                  <button onClick={() => { actions.resolveDispute(b.id, true); toast.success("Refunded client"); }} className="rounded-full border px-4 py-1.5 text-sm">Refund client</button>
                  <button onClick={() => { actions.resolveDispute(b.id, false); toast.success("Released to vendor"); }} className="rounded-full bg-primary px-4 py-1.5 text-sm text-primary-foreground">Release to vendor</button>
                </div>
              ) : <span className="text-xs uppercase tracking-wider text-muted-foreground">{b.status.replace("_", " ")}</span>}
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </main>
  );
}

function Num({ label, v, on }: { label: string; v: number; on: (n: number) => void }) {
  return <label className="block text-xs text-muted-foreground">{label}<input type="number" min={0} value={Math.round(v * 100) / 100} onChange={(e) => on(Number(e.target.value) || 0)} className="mt-1 w-full rounded-lg border bg-background p-2 text-sm text-foreground" /></label>;
}
