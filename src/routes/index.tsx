import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Coins, MapPin, KeyRound, Lock, TrendingUp, Megaphone, Banknote, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import hero from "@/assets/hero.png.asset.json";
import { DEFAULT_RULES, TIER_ORDER, ksh, serviceCoins } from "@/lib/pricing";
import { SERVICES, actions } from "@/lib/store";
import { TierBadge } from "@/components/SiteNav";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Beauty Wallet — Beauty & grooming subscription in Nairobi" },
      { name: "description", content: "Subscribe monthly, get coins, and book vetted salons and barbers across Nairobi with zero cash on site." },
      { property: "og:title", content: "Beauty Wallet — Curated beauty & grooming, styled securely" },
      { property: "og:description", content: "A monthly coin subscription for beauty and grooming across Westlands, Kilimani and Karen." },
    ],
  }),
  component: Landing,
});

const steps = [
  { icon: Coins, t: "Subscribe & receive coins", d: "Pick a tier and get a fresh coin allowance every month." },
  { icon: MapPin, t: "Discover vetted salons", d: "Book across Nairobi. Zero cash paid on site — coins are held safely until you're done." },
  { icon: KeyRound, t: "Arrive with your 4-digit pass", d: "Show your PIN or QR. Coins release only after your service is complete." },
];

const faqs = [
  ["Are coins the same as cash?", "No. Coins are an internal unit for services, priority and convenience, anchored to a visible Ksh value so you always know what you're saving."],
  ["What happens if a service doesn't go well?", "Your coins sit in escrow until the vendor marks it complete. Raise a dispute and our team reviews it before any payout."],
  ["Do unused coins roll over?", "Intermediate members keep 25% of unused coins and Premium members keep 50%. Basic coins reset monthly."],
  ["Is it for men too?", "Absolutely — barbers, beard care, facials and at-home grooming are all part of the network."],
];

function Landing() {
  const [form, setForm] = useState({ name: "", owner: "", area: "", payoutMethod: "" });
  return (
    <main>
      <section className="relative overflow-hidden">
        <img src={hero.url} alt="Beauty Wallet with cosmetics and grooming tools" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/30" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 md:py-36">
          <p className="text-xs uppercase tracking-[0.3em] text-rose">Curated beauty & grooming, styled securely</p>
          <h1 className="mt-5 max-w-3xl text-5xl leading-[1.05] md:text-7xl">One monthly wallet for every cut, braid, facial & fade.</h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">Beauty Wallet is a subscription for men and women. Pay monthly in Ksh, receive coins, and spend them at vetted salons, barbers and pros across Nairobi.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/app" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Explore as subscriber</Link>
            <a href="#pricing" className="rounded-full border border-foreground/30 px-6 py-3 text-sm font-semibold">See tiers</a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="text-4xl">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.t} className="rounded-3xl border bg-card p-8">
              <div className="flex items-center justify-between"><s.icon className="h-6 w-6 text-rose" /><span className="font-display text-5xl text-muted-foreground/40">0{i + 1}</span></div>
              <h3 className="mt-6 text-2xl">{s.t}</h3>
              <p className="mt-2 text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="bg-primary py-20 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-4xl">Tiers & pricing</h2>
          <p className="mt-2 opacity-70">1 coin ≈ {ksh(DEFAULT_RULES.kshPerCoin)} of service value. Higher tiers spend fewer coins per service.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {TIER_ORDER.map((id) => {
              const t = DEFAULT_RULES.tiers[id];
              return (
                <div key={id} className={`rounded-3xl border border-primary-foreground/15 p-8 ${id === "intermediate" ? "bg-primary-foreground/10" : ""}`}>
                  <div className="flex items-center justify-between"><h3 className="text-3xl">{t.name}</h3>
                    <span className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-primary">{t.discount ? `${t.discount * 100}% off coins` : "Anchor price"}</span></div>
                  <p className="mt-4 font-display text-5xl">{ksh(t.priceKsh)}<span className="text-base opacity-60"> /mo</span></p>
                  <p className="mt-1 text-gold">{t.monthlyCoins.toLocaleString()} coins monthly</p>
                  <ul className="mt-6 space-y-2 text-sm opacity-85">{t.perks.map((p) => <li key={p}>— {p}</li>)}</ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="text-4xl">Popular in Nairobi</h2>
        <p className="mt-2 text-muted-foreground">Coin prices shown for Basic members. Premium treatments unlock with higher tiers.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <div key={s.id} className="relative rounded-2xl border bg-card p-6">
              <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{s.area} · {s.category}</span><TierBadge tier={s.tier} /></div>
              <h3 className="mt-3 text-2xl">{s.name}</h3>
              <p className="text-sm text-muted-foreground">{s.vendor}</p>
              <div className="mt-4 flex items-end justify-between">
                <span className="text-sm text-muted-foreground line-through">{ksh(s.cashKsh)}</span>
                {s.tier === "basic" ? <span className="font-semibold">{serviceCoins(s.cashKsh, "basic")} coins</span>
                  : <span className="flex items-center gap-1 text-sm text-rose"><Lock className="h-3.5 w-3.5" /> {DEFAULT_RULES.tiers[s.tier].name} tier</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="vendors" className="bg-secondary py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 md:grid-cols-2">
          <div>
            <h2 className="text-4xl">For vendors</h2>
            <p className="mt-3 text-muted-foreground">Join Nairobi's curated network. We bring the clients; you do the craft.</p>
            <div className="mt-8 space-y-5">
              {[[TrendingUp, "Steady demand", "Subscribers with pre-paid coins, every month."], [Megaphone, "Lower marketing spend", "We handle acquisition, billing and subscriptions."], [Banknote, "Direct payouts", "Batch payouts straight to M-Pesa or your bank."]].map(([I, t, d]) => {
                const Icon = I as typeof TrendingUp;
                return <div key={t as string} className="flex gap-4"><Icon className="mt-1 h-5 w-5 text-rose" /><div><p className="font-semibold">{t as string}</p><p className="text-sm text-muted-foreground">{d as string}</p></div></div>;
              })}
            </div>
          </div>
          <form className="space-y-3 rounded-3xl border bg-card p-8" onSubmit={(e) => {
            e.preventDefault();
            if (!form.name || !form.owner || !form.area) return toast.error("Please fill in business, owner and area");
            actions.addVendor({ ...form, cls: "basic", kyc: ["Business permit"], payoutMethod: form.payoutMethod || "M-Pesa" });
            setForm({ name: "", owner: "", area: "", payoutMethod: "" });
            toast.success("Application received — you'll appear in the Admin vetting queue.");
          }}>
            <h3 className="text-2xl">Partner application</h3>
            {([["name", "Business name"], ["owner", "Owner full name"], ["area", "Area (e.g. Westlands)"], ["payoutMethod", "M-Pesa till / bank account"]] as const).map(([k, l]) => (
              <input key={k} placeholder={l} value={form[k]} maxLength={100} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            ))}
            <button className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground">Apply to partner</button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20">
        <h2 className="text-4xl">Questions</h2>
        <Accordion type="single" collapsible className="mt-6">
          {faqs.map(([q, a]) => <AccordionItem key={q} value={q}><AccordionTrigger className="text-left text-base">{q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{a}</AccordionContent></AccordionItem>)}
        </Accordion>
        <div className="mt-10 grid gap-4 sm:grid-cols-3 text-sm">
          {["Every vendor KYC-vetted", "Coins held in escrow", "No cash on site"].map((t) => <div key={t} className="flex items-center gap-2 rounded-xl border bg-card p-4"><ShieldCheck className="h-4 w-4 text-gold-foreground" />{t}</div>)}
        </div>
      </section>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">© 2026 Beauty Wallet · Nairobi, Kenya</footer>
    </main>
  );
}
