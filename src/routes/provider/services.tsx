import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ProviderMoreLinks, ProviderShell } from "@/components/provider/ProviderShell";
import { usePortal } from "@/components/provider/portal-context";
import { buttonClass } from "@/components/site/primitives";
import {
  coinPrices,
  formatDuration,
  ksh,
  payoutFor,
  type PortalService,
} from "@/lib/provider-portal-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/provider/services")({
  component: ServicesPage,
});

function ServicesPage() {
  const data = usePortal();
  const [editing, setEditing] = useState<PortalService | null>(null);
  const services = [...data.services].sort(
    (a, b) => a.sort - b.sort || a.name.localeCompare(b.name),
  );
  const pct = data.provider.payout_pct;

  return (
    <ProviderShell
      data={data}
      title="Services"
      topAction={
        <button type="button" className={buttonClass({ size: "s" })}>
          Add service
        </button>
      }
    >
      <div className="pt-4 lg:pt-7">
        <div className="rounded-[20px] border border-border bg-card p-5">
          <h2 className="type-body-m-medium">How pricing works at Intermediate class</h2>
          <p className="mt-2 type-body-s text-muted-foreground">
            You set the cash price. Members pay in coins at their plan rate, and you’re paid{" "}
            {Math.round(pct * 100)}% of the cash price for every visit, whatever plan the member is
            on.
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-[20px] border border-border bg-card">
          <div className="hidden grid-cols-[1.4fr_repeat(5,0.7fr)_72px] gap-2 border-b border-border px-5 py-3 type-eyebrow text-muted-foreground lg:grid">
            <span>Service</span>
            <span>Cash price</span>
            <span>Basic</span>
            <span>Intermediate</span>
            <span>Premium</span>
            <span>Your payout</span>
            <span>Live</span>
          </div>
          <ul>
            {services.map((s) => {
              const coins = coinPrices(s.cash_ksh);
              const pay = payoutFor(s.cash_ksh, pct);
              return (
                <li key={s.id} className="border-t border-border first:border-0">
                  <button
                    type="button"
                    onClick={() => setEditing(s)}
                    className="flex w-full flex-col gap-2 px-4 py-4 text-left transition hover:bg-muted/40 lg:grid lg:grid-cols-[1.4fr_repeat(5,0.7fr)_72px] lg:items-center lg:gap-2 lg:px-5"
                  >
                    <div>
                      <p className="type-body-s-medium">{s.name}</p>
                      <p className="type-body-s text-muted-foreground">
                        {formatDuration(s.minutes)}
                      </p>
                    </div>
                    <p className="type-body-s lg:type-body-s-medium">{ksh(s.cash_ksh)}</p>
                    <p className="hidden type-body-s lg:block">{coins.basic}</p>
                    <p className="hidden type-body-s lg:block">{coins.intermediate}</p>
                    <p className="hidden type-body-s lg:block">{coins.premium}</p>
                    <p className="type-body-s-medium">{ksh(pay)}</p>
                    <span
                      className={cn(
                        "size-2.5 rounded-full lg:mx-auto",
                        s.active ? "bg-success" : "bg-muted-foreground",
                      )}
                    />
                    <p className="type-body-s text-muted-foreground lg:hidden">
                      Basic {coins.basic} · Int {coins.intermediate} · Prem {coins.premium} coins
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <ProviderMoreLinks />

      {editing && (
        <EditServiceSheet service={editing} payoutPct={pct} onClose={() => setEditing(null)} />
      )}
    </ProviderShell>
  );
}

function EditServiceSheet({
  service,
  payoutPct,
  onClose,
}: {
  service: PortalService;
  payoutPct: number;
  onClose: () => void;
}) {
  const [name, setName] = useState(service.name);
  const [cash, setCash] = useState(String(service.cash_ksh));
  const [minutes, setMinutes] = useState(String(service.minutes));
  const cashN = Number(cash) || 0;
  const coins = coinPrices(cashN);
  const pay = payoutFor(cashN, payoutPct);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 lg:items-center lg:p-6">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-card p-6 lg:rounded-[28px]">
        <h3 className="font-display text-2xl">Edit service</h3>
        <label className="mt-5 block">
          <span className="type-body-s text-muted-foreground">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 h-12 w-full rounded-2xl border border-border bg-background px-4 outline-none"
          />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label>
            <span className="type-body-s text-muted-foreground">Cash price (Ksh)</span>
            <input
              value={cash}
              onChange={(e) => setCash(e.target.value.replace(/\D/g, ""))}
              className="mt-1.5 h-12 w-full rounded-2xl border border-border bg-background px-4 outline-none"
            />
          </label>
          <label>
            <span className="type-body-s text-muted-foreground">Minutes</span>
            <input
              value={minutes}
              onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))}
              className="mt-1.5 h-12 w-full rounded-2xl border border-border bg-background px-4 outline-none"
            />
          </label>
        </div>
        <div className="mt-5 rounded-2xl bg-muted p-4">
          <p className="type-body-s-medium">Coin prices & payout</p>
          <ul className="mt-2 space-y-1 type-body-s">
            <li className="flex justify-between">
              <span>Basic</span>
              <span>{coins.basic} coins</span>
            </li>
            <li className="flex justify-between">
              <span>Intermediate</span>
              <span>{coins.intermediate} coins</span>
            </li>
            <li className="flex justify-between">
              <span>Premium</span>
              <span>{coins.premium} coins</span>
            </li>
            <li className="flex justify-between border-t border-border pt-2 type-body-s-medium">
              <span>Your payout</span>
              <span>{ksh(pay)}</span>
            </li>
          </ul>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={buttonClass({ full: true, className: "mt-6" })}
        >
          Save changes
        </button>
        <button
          type="button"
          onClick={onClose}
          className={buttonClass({ variant: "ghost", full: true, className: "mt-2" })}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
