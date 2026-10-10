import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Stat } from "@/components/SiteNav";
import { SERVICES, actions, useStore, type BookingStatus } from "@/lib/store";
import { ksh } from "@/lib/pricing";

export const Route = createFileRoute("/vendor")({
  head: () => ({
    meta: [
      { title: "Order Board — Beauty Wallet Vendor" },
      { name: "description", content: "Verify arrival PINs, run today's queue and release escrow." },
      { property: "og:title", content: "Order Board — Beauty Wallet Vendor" },
      { property: "og:description", content: "The in-salon daily order board for Beauty Wallet partners." },
    ],
  }),
  component: VendorBoard,
});

const VENDOR = "Kinyozi Republic";
const cols: { id: BookingStatus; label: string }[] = [
  { id: "upcoming", label: "Upcoming" }, { id: "in_service", label: "In service" }, { id: "completed", label: "Completed" },
];

function VendorBoard() {
  const all = useStore((s) => s.bookings);
  const bookings = all.filter((b) => b.vendor === VENDOR);
  const [code, setCode] = useState("");
  const earned = bookings.filter((b) => b.status === "completed").reduce((t, b) => t + b.payoutKsh, 0);
  const names = (ids: string[]) => SERVICES.filter((s) => ids.includes(s.id)).map((s) => s.name).join(" + ");

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    const b = bookings.find((x) => x.status === "upcoming" && (x.pin === c || x.id.slice(-6).toUpperCase() === c));
    if (!b) return toast.error("No upcoming booking matches that code");
    actions.start(b.id); setCode(""); toast.success(`Verified ${b.customer} — service started`);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <p className="text-sm text-muted-foreground">{VENDOR} · Westlands</p>
      <h1 className="text-4xl">The Order Board</h1>
      <form onSubmit={verify} className="mt-6 flex items-center gap-3 rounded-2xl border bg-card p-3">
        <Search className="ml-2 h-5 w-5 text-muted-foreground" />
        <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} placeholder="Enter 4-digit arrival PIN or 6-character walk-in token"
          className="flex-1 bg-transparent font-display text-2xl tracking-widest outline-none placeholder:font-sans placeholder:text-sm placeholder:tracking-normal" />
        <button className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Verify & start</button>
      </form>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Today's completed earnings" value={ksh(earned)} sub="Net of platform fee" />
        <Stat label="Waiting" value={String(bookings.filter((b) => b.status === "upcoming").length)} />
        <Stat label="In service" value={String(bookings.filter((b) => b.status === "in_service").length)} />
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {cols.map((c) => (
          <section key={c.id} className="rounded-3xl bg-muted p-4">
            <h2 className="px-2 text-xl">{c.label}</h2>
            <div className="mt-3 space-y-3">
              {bookings.filter((b) => b.status === c.id).map((b) => (
                <div key={b.id} className="rounded-2xl border bg-card p-4">
                  <div className="flex justify-between text-xs text-muted-foreground"><span>{b.when}</span><span>{ksh(b.payoutKsh)} payout</span></div>
                  <p className="mt-1 font-semibold">{b.customer}</p>
                  <p className="text-sm text-muted-foreground">{names(b.serviceIds)}</p>
                  {b.addOns.length > 0 && <p className="mt-1 text-xs text-rose">{b.addOns.join(", ")}</p>}
                  {c.id === "upcoming" && <p className="mt-3 text-xs text-muted-foreground">Ask client for their PIN to start</p>}
                  {c.id === "in_service" && <button onClick={() => { actions.complete(b.id); toast.success("Complete — escrow released"); }} className="mt-3 w-full rounded-full bg-success py-2 text-sm font-semibold text-primary-foreground">Mark complete</button>}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
