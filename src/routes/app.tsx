import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Lock, Search, RefreshCw, Layers } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Stat, TierBadge } from "@/components/SiteNav";
import { ADDONS, SERVICES, actions, useStore, type Booking } from "@/lib/store";
import { TIER_ORDER, bookingCoins, canAccess, ksh, serviceCoins, type TierId } from "@/lib/pricing";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "My Wallet — Beauty Wallet" },
      { name: "description", content: "Your coin balance, marketplace and booking passes." },
      { property: "og:title", content: "My Wallet — Beauty Wallet" },
      { property: "og:description", content: "Browse Nairobi treatments, book with coins and arrive with your PIN." },
    ],
  }),
  component: Subscriber,
});

function Subscriber() {
  const user = useStore((s) => s.user);
  const rules = useStore((s) => s.rules);
  const bookings = useStore((s) => s.bookings);
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [addOns, setAddOns] = useState<string[]>([]);
  const [when, setWhen] = useState("Today 14:00");
  const [pass, setPass] = useState<string | null>(null);

  const list = SERVICES.filter((s) => (s.name + s.vendor + s.area + s.category).toLowerCase().includes(q.toLowerCase()));
  const items = SERVICES.filter((s) => cart.includes(s.id));
  const addOnCoins = ADDONS.filter((a) => addOns.includes(a.id)).reduce((t, a) => t + a.coins, 0);
  const total = useMemo(() => (items.length ? bookingCoins(items, addOnCoins, user.tier, rules) : 0), [items, addOnCoins, user.tier, rules]);
  const anchor = items.reduce((t, i) => t + i.cashKsh, 0);
  const mine = bookings.filter((b) => b.customer === user.name && b.status !== "completed");
  const active = bookings.find((b) => b.id === pass);

  const toggle = (id: string) => setCart((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm text-muted-foreground">Karibu,</p><h1 className="text-4xl">{user.name}</h1></div>
        <label className="text-sm">Demo tier{" "}
          <select value={user.tier} onChange={(e) => actions.setTier(e.target.value as TierId)} className="ml-2 rounded-full border bg-card px-3 py-1.5">
            {TIER_ORDER.map((t) => <option key={t} value={t}>{rules.tiers[t].name}</option>)}
          </select></label>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-primary p-5 text-primary-foreground sm:col-span-1">
          <p className="text-xs uppercase tracking-widest opacity-70">Available coins</p>
          <p className="mt-2 font-display text-5xl">{user.available}</p>
          <p className="text-xs text-gold">≈ {ksh(user.available * rules.kshPerCoin)} service value</p>
        </div>
        <Stat label="In escrow (reserved)" value={`${user.escrow} coins`} sub="Released to vendor after completion" />
        <Stat label="Plan" value={rules.tiers[user.tier].name} sub={`${rules.tiers[user.tier].monthlyCoins} coins/mo · ${rules.tiers[user.tier].discount * 100}% off`} />
      </div>

      {mine.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl">Active passes</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {mine.map((b) => <PassCard key={b.id} b={b} onOpen={() => setPass(b.id)} />)}
          </div>
        </section>
      )}

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl">Marketplace</h2>
          <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2"><Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search braids, Karen, facial…" className="w-56 bg-transparent text-sm outline-none" /></div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => {
            const ok = canAccess(user.tier, s.tier);
            const inCart = cart.includes(s.id);
            return (
              <div key={s.id} className={`rounded-2xl border bg-card p-5 ${ok ? "" : "opacity-75"} ${inCart ? "ring-2 ring-rose" : ""}`}>
                <div className="flex justify-between text-xs text-muted-foreground"><span>{s.area} · {s.minutes} min</span><TierBadge tier={s.tier} /></div>
                <h3 className="mt-2 text-xl">{s.name}</h3>
                <p className="text-sm text-muted-foreground">{s.vendor}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div><span className="text-xs text-muted-foreground line-through">{ksh(s.cashKsh)}</span>
                    <p className="font-semibold">{serviceCoins(s.cashKsh, user.tier, rules)} coins</p></div>
                  {ok ? <button onClick={() => toggle(s.id)} className={`rounded-full px-4 py-2 text-sm font-semibold ${inCart ? "bg-rose text-primary" : "bg-primary text-primary-foreground"}`}>{inCart ? "Added" : "Add"}</button>
                    : <button onClick={() => { actions.setTier(s.tier); toast.success(`Upgraded to ${rules.tiers[s.tier].name} (demo)`); }} className="flex items-center gap-1 rounded-full border border-rose px-3 py-2 text-xs text-rose"><Lock className="h-3 w-3" />Upgrade to {rules.tiers[s.tier].name}</button>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-30 mx-auto flex w-fit items-center gap-4 rounded-full bg-primary px-6 py-3 text-primary-foreground shadow-xl">
          <span className="text-sm">{cart.length} service{cart.length > 1 ? "s" : ""} · {total} coins {cart.length > 1 && <span className="text-gold">(bundle saving)</span>}</span>
          <button onClick={() => setOpen(true)} className="rounded-full bg-gold px-4 py-1.5 text-sm font-semibold text-primary">Review booking</button>
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader><SheetTitle className="font-display text-3xl">Confirm booking</SheetTitle></SheetHeader>
          <div className="space-y-4 px-4 pb-6 text-sm">
            {items.length > 1 && <p className="flex items-center gap-2 rounded-xl bg-secondary p-3"><Layers className="h-4 w-4" />Grouped booking — {rules.groupSavings * 100}% bundle saving applied</p>}
            {items.map((i) => <div key={i.id} className="flex justify-between border-b pb-2"><div><p className="font-medium">{i.name}</p><p className="text-xs text-muted-foreground">{i.vendor} · {i.minutes} min</p></div><span>{serviceCoins(i.cashKsh, user.tier, rules)} c</span></div>)}
            <div>
              <p className="mb-2 font-semibold">Convenience add-ons</p>
              {ADDONS.filter((a) => a.id !== "a3" || user.tier === "premium").map((a) => (
                <label key={a.id} className="flex items-center justify-between py-1"><span><input type="checkbox" className="mr-2" checked={addOns.includes(a.id)} onChange={() => setAddOns((x) => x.includes(a.id) ? x.filter((y) => y !== a.id) : [...x, a.id])} />{a.label}</span><span>+{a.coins} c</span></label>
              ))}
            </div>
            <label className="block">Time<select value={when} onChange={(e) => setWhen(e.target.value)} className="mt-1 w-full rounded-lg border bg-background p-2">{["Today 14:00", "Today 16:30", "Tomorrow 10:00"].map((t) => <option key={t}>{t}</option>)}</select></label>
            <div className="space-y-1 rounded-xl bg-muted p-4">
              <Row l="Total duration" r={`${items.reduce((t, i) => t + i.minutes, 0)} min`} />
              <Row l="Ksh cash anchor" r={ksh(anchor)} />
              <Row l="Tier discount" r={`${rules.tiers[user.tier].discount * 100}%`} />
              <Row l="Total" r={<b>{total} coins</b>} />
            </div>
            <p className="text-xs text-muted-foreground">Authorizing places an escrow hold of {total} coins. They move to the vendor only after your service is marked complete.</p>
            <button onClick={() => {
              const r = actions.book(cart, addOns, when);
              if (typeof r === "string") return toast.error(r);
              setCart([]); setAddOns([]); setOpen(false); setPass(r.id); toast.success("Escrow hold authorized");
            }} className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground">Authorize escrow hold</button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!active} onOpenChange={(o) => !o && setPass(null)}>
        <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-3xl">
          {active && (
            <div className="space-y-4 p-6 text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Arrival pass · {active.vendor}</p>
              <p className="font-display text-7xl tracking-[0.3em]">{active.pin}</p>
              <div className="mx-auto w-fit rounded-xl bg-card p-3"><QRCodeSVG value={`BW:${active.id}:${active.pin}`} size={160} /></div>
              <p className="text-sm text-muted-foreground">{active.when} · {active.coins} coins in escrow</p>
              <button onClick={() => actions.refreshPin(active.id)} className="inline-flex items-center gap-2 text-sm text-rose"><RefreshCw className="h-4 w-4" />Refresh PIN</button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </main>
  );
}

const Row = ({ l, r }: { l: string; r: React.ReactNode }) => <div className="flex justify-between"><span className="text-muted-foreground">{l}</span><span>{r}</span></div>;

function PassCard({ b, onOpen }: { b: Booking; onOpen: () => void }) {
  const names = SERVICES.filter((s) => b.serviceIds.includes(s.id)).map((s) => s.name).join(" + ");
  return (
    <button onClick={onOpen} className="flex items-center justify-between rounded-2xl border bg-card p-5 text-left">
      <div><p className="font-semibold">{names}</p><p className="text-sm text-muted-foreground">{b.vendor} · {b.when} · {b.status === "in_service" ? "In service" : "Upcoming"}</p></div>
      <span className="font-display text-3xl tracking-widest">{b.pin}</span>
    </button>
  );
}
