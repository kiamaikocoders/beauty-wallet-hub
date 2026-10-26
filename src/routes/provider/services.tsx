import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ProviderMoreLinks, ProviderShell } from "@/components/provider/ProviderShell";
import { usePortal } from "@/components/provider/portal-context";
import { buttonClass } from "@/components/site/primitives";
import { saveProviderService } from "@/lib/command-center";
import {
  coinPrices,
  formatDuration,
  ksh,
  payoutFor,
  type PortalService,
} from "@/lib/provider-portal-data";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  ["hair", "Hair"],
  ["braids-locs", "Braids & locs"],
  ["barber", "Barber"],
  ["nails", "Nails"],
  ["skin", "Skin & facials"],
  ["makeup", "Makeup"],
  ["massage", "Massage & spa"],
  ["lashes-brows", "Lashes & brows"],
] as const;

export const Route = createFileRoute("/provider/services")({
  component: ServicesPage,
});

function blankService(): PortalService {
  return {
    id: "",
    name: "",
    category: "hair",
    section: null,
    cash_ksh: 1500,
    minutes: 60,
    active: true,
    sort: 0,
  };
}

function ServicesPage() {
  const data = usePortal();
  const [services, setServices] = useState<PortalService[]>(() =>
    [...data.services].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name)),
  );
  const [editing, setEditing] = useState<PortalService | null>(null);
  const pct = data.provider.payout_pct;

  return (
    <ProviderShell
      data={data}
      title="Services"
      topAction={
        <button type="button" className={buttonClass({ size: "s" })} onClick={() => setEditing(blankService())}>
          Add service
        </button>
      }
    >
      <div className="pt-4 lg:pt-7">
        <div className="rounded-[20px] border border-border bg-card p-5">
          <h2 className="type-body-m-medium">How pricing works</h2>
          <p className="mt-2 type-body-s text-muted-foreground">
            You set the cash price. Members pay in coins at their plan rate, and you are paid{" "}
            {Math.round(pct * 100)}% of the cash price for every visit.
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-[20px] border border-border bg-card">
          {services.length === 0 && (
            <p className="px-5 py-6 type-body-s text-muted-foreground">No services yet. Add the first one.</p>
          )}
          <ul>
            {services.map((service) => {
              const coins = coinPrices(service.cash_ksh);
              const pay = payoutFor(service.cash_ksh, pct);
              return (
                <li key={service.id || service.name} className="border-t border-border first:border-0">
                  <button
                    type="button"
                    onClick={() => setEditing(service)}
                    className="flex w-full flex-col gap-2 px-4 py-4 text-left transition hover:bg-muted/40 lg:grid lg:grid-cols-[1.4fr_repeat(5,0.7fr)_72px] lg:items-center lg:gap-2 lg:px-5"
                  >
                    <div>
                      <p className="type-body-s-medium">{service.name}</p>
                      <p className="type-body-s text-muted-foreground">{formatDuration(service.minutes)}</p>
                    </div>
                    <p className="type-body-s lg:type-body-s-medium">{ksh(service.cash_ksh)}</p>
                    <p className="hidden type-body-s lg:block">{coins.basic}</p>
                    <p className="hidden type-body-s lg:block">{coins.intermediate}</p>
                    <p className="hidden type-body-s lg:block">{coins.premium}</p>
                    <p className="type-body-s-medium">{ksh(pay)}</p>
                    <span className={cn("size-2.5 rounded-full lg:mx-auto", service.active ? "bg-success" : "bg-muted-foreground")} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <ProviderMoreLinks />
      {editing && (
        <EditServiceSheet
          service={editing}
          payoutPct={pct}
          slug={data.provider.slug}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setServices((current) => {
              const next = current.some((row) => row.id === saved.id)
                ? current.map((row) => (row.id === saved.id ? saved : row))
                : [...current, saved];
              return next.sort((a, b) => a.name.localeCompare(b.name));
            });
            setEditing(null);
          }}
        />
      )}
    </ProviderShell>
  );
}

function EditServiceSheet({
  service,
  payoutPct,
  slug,
  onClose,
  onSaved,
}: {
  service: PortalService;
  payoutPct: number;
  slug: string;
  onClose: () => void;
  onSaved: (service: PortalService) => void;
}) {
  const [name, setName] = useState(service.name);
  const [category, setCategory] = useState(service.category || "hair");
  const [cash, setCash] = useState(String(service.cash_ksh));
  const [minutes, setMinutes] = useState(String(service.minutes));
  const [active, setActive] = useState(service.active);
  const [busy, setBusy] = useState(false);
  const cashN = Number(cash) || 0;
  const coins = coinPrices(cashN);
  const pay = payoutFor(cashN, payoutPct);

  async function save() {
    setBusy(true);
    try {
      const result = await saveProviderService({
        slug,
        id: service.id || null,
        name,
        category,
        cash: cashN,
        minutes: Number(minutes) || 0,
        active,
      });
      onSaved({
        ...service,
        id: result.id,
        name: name.trim(),
        category,
        cash_ksh: cashN,
        minutes: Number(minutes) || 0,
        active,
      });
      toast.success(service.id ? "Service saved" : "Service added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the service");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 lg:items-center lg:p-6">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-card p-6 lg:rounded-[28px]">
        <h3 className="font-display text-2xl">{service.id ? "Edit service" : "Add service"}</h3>
        <label className="mt-5 block">
          <span className="type-body-s text-muted-foreground">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 h-12 w-full rounded-2xl border border-border bg-background px-4 outline-none" />
        </label>
        <label className="mt-4 block">
          <span className="type-body-s text-muted-foreground">Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1.5 h-12 w-full rounded-2xl border border-border bg-background px-4 outline-none">
            {CATEGORIES.map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </label>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label>
            <span className="type-body-s text-muted-foreground">Cash price (Ksh)</span>
            <input value={cash} onChange={(e) => setCash(e.target.value.replace(/\D/g, ""))} className="mt-1.5 h-12 w-full rounded-2xl border border-border bg-background px-4 outline-none" />
          </label>
          <label>
            <span className="type-body-s text-muted-foreground">Minutes</span>
            <input value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))} className="mt-1.5 h-12 w-full rounded-2xl border border-border bg-background px-4 outline-none" />
          </label>
        </div>
        <label className="mt-4 flex items-center gap-2 type-body-s">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Live on the menu
        </label>
        <div className="mt-5 rounded-2xl bg-muted p-4">
          <p className="type-body-s-medium">Coin prices and payout</p>
          <ul className="mt-2 space-y-1 type-body-s">
            <li className="flex justify-between"><span>Basic</span><span>{coins.basic} coins</span></li>
            <li className="flex justify-between"><span>Intermediate</span><span>{coins.intermediate} coins</span></li>
            <li className="flex justify-between"><span>Premium</span><span>{coins.premium} coins</span></li>
            <li className="flex justify-between border-t border-border pt-2 type-body-s-medium"><span>Your payout</span><span>{ksh(pay)}</span></li>
          </ul>
        </div>
        <button type="button" disabled={busy} onClick={() => void save()} className={buttonClass({ full: true, className: "mt-6" })}>
          Save changes
        </button>
        <button type="button" onClick={onClose} className={buttonClass({ variant: "ghost", full: true, className: "mt-2" })}>
          Cancel
        </button>
      </div>
    </div>
  );
}
