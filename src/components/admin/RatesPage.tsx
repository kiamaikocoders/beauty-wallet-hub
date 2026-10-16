import { useState } from "react";
import { toast } from "sonner";
import { buttonClass, TierBadge, tierName } from "@/components/site/primitives";
import { RATE_BANDS } from "@/lib/admin-seed";
import { adminUpdatePayoutBand } from "@/lib/admin-api";
import { CardPanel, ModalShell, Panel, SectionTitle, StatusPill } from "./ui";
import type { TierId } from "@/lib/pricing";

export function RatesPage() {
  const [editOpen, setEditOpen] = useState(false);
  const [lowest, setLowest] = useState(RATE_BANDS.editBand.lowest);
  const [highest, setHighest] = useState(RATE_BANDS.editBand.highest);
  const [defaultPct, setDefaultPct] = useState(RATE_BANDS.editBand.defaultPct);
  const [busy, setBusy] = useState(false);

  async function schedule() {
    setBusy(true);
    try {
      await adminUpdatePayoutBand({
        classId: "basic",
        minPct: Number(lowest.replace("%", "")) / 100,
        maxPct: Number(highest.replace("%", "")) / 100,
        defaultPct: Number(defaultPct.replace("%", "")) / 100,
      });
      toast.success("Scheduled for 10 Nov");
      setEditOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update band");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled
          title="Change history is not available yet"
          className={buttonClass({ variant: "secondary", size: "s", className: "opacity-60" })}
        >
          Change history
        </button>
        <button
          type="button"
          className={buttonClass({ variant: "secondary", size: "s" })}
          onClick={() => setEditOpen(true)}
        >
          Simulate a change
        </button>
      </div>

      <Panel className="flex flex-col gap-4">
        <SectionTitle
          title="Margin per visit"
          action={
            <button
              type="button"
              className={buttonClass({ size: "s" })}
              onClick={() => setEditOpen(true)}
            >
              Fix rate bands
            </button>
          }
        />
        <p className="type-caption text-muted-foreground">
          Rows are member plans. Columns are provider classes. Cells under the 5% floor need a payout
          or plan change.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr>
                <th className="pb-3 text-left type-label-s text-muted-foreground">Member plan</th>
                {(["basic", "intermediate", "premium"] as TierId[]).map((t) => (
                  <th key={t} className="pb-3 text-left type-label-s text-muted-foreground">
                    {tierName[t]} provider
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RATE_BANDS.marginMatrix.map((row) => (
                <tr key={row.member} className="border-t border-border">
                  <td className="py-4 type-body-s-semibold">{row.member}</td>
                  {row.cells.map((cell, i) => (
                    <td key={i} className="py-4">
                      <p className="type-h4">{cell.value}</p>
                      {cell.note && (
                        <button
                          type="button"
                          onClick={() => setEditOpen(true)}
                          className="mt-1 text-left"
                        >
                          <StatusPill
                            tone={
                              cell.tone === "bad"
                                ? "error"
                                : cell.tone === "warn"
                                  ? "warning"
                                  : "neutral"
                            }
                          >
                            {cell.note} · Fix
                          </StatusPill>
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="type-caption text-muted-foreground">
          Margin = (coins the member pays − provider payout) ÷ coins the member pays. Expired coins
          are not counted here.
        </p>
      </Panel>

      <Panel className="flex flex-col gap-4">
        <SectionTitle
          title="Provider classes and payout bands"
          action={
            <button
              type="button"
              className={buttonClass({ size: "s" })}
              onClick={() => setEditOpen(true)}
            >
              Edit
            </button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="type-label-s text-muted-foreground">
                <th className="pb-3">Class</th>
                <th className="pb-3">Providers</th>
                <th className="pb-3">Band</th>
                <th className="pb-3">Default</th>
                <th className="pb-3">Average now</th>
              </tr>
            </thead>
            <tbody>
              {RATE_BANDS.classes.map((c) => (
                <tr key={c.class} className="border-t border-border">
                  <td className="py-4">
                    <TierBadge tier={c.class} />
                  </td>
                  <td className="py-4 type-body-s">{c.providers}</td>
                  <td className="py-4 type-body-s">{c.band}</td>
                  <td className="py-4 type-body-s-semibold">{c.defaultPct}</td>
                  <td className="py-4 type-body-s">{c.average}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel className="flex flex-col gap-3">
          <SectionTitle title="Plans" />
          {RATE_BANDS.plans.map((p) => (
            <CardPanel key={p.tier} className="flex items-start justify-between gap-3">
              <div>
                <TierBadge tier={p.tier} />
                <p className="mt-2 type-body-s-semibold">{p.price}</p>
                <p className="type-caption text-muted-foreground">{p.detail}</p>
              </div>
            </CardPanel>
          ))}
        </Panel>
        <Panel className="flex flex-col gap-3">
          <SectionTitle title="Rules" />
          {RATE_BANDS.rules.map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between gap-3 border-t border-border py-3 first:border-t-0 first:pt-0"
            >
              <span className="type-body-s text-muted-foreground">{r.label}</span>
              <span className="type-body-s-semibold">{r.value}</span>
            </div>
          ))}
          <p className="type-caption text-muted-foreground">
            Changes to plans or payout rates reach members and providers 30 days before they start.
          </p>
        </Panel>
      </div>

      <ModalShell
        open={editOpen}
        title={RATE_BANDS.editBand.title}
        subtitle={RATE_BANDS.editBand.subtitle}
        onClose={() => setEditOpen(false)}
        footer={
          <>
            <button
              type="button"
              className={buttonClass({ variant: "secondary", size: "s" })}
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={buttonClass({ size: "s" })}
              disabled={busy}
              onClick={schedule}
            >
              Schedule for 10 Nov
            </button>
          </>
        }
      >
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Lowest", value: lowest, set: setLowest },
            { label: "Highest", value: highest, set: setHighest },
            { label: "Default", value: defaultPct, set: setDefaultPct },
          ].map((f) => (
            <label key={f.label} className="block">
              <span className="type-caption text-muted-foreground">{f.label}</span>
              <input
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 type-body-m outline-none focus:border-foreground"
              />
            </label>
          ))}
        </div>
        <p className="mt-2 type-caption text-muted-foreground">{RATE_BANDS.editBand.was}</p>
        <p className="mt-4 type-label-s text-muted-foreground">Margin after this change</p>
        <div className="mt-2 overflow-hidden rounded-md border border-border">
          <table className="w-full text-center type-caption">
            <thead className="bg-muted">
              <tr>
                <th className="p-2" />
                <th className="p-2">Basic</th>
                <th className="p-2">Inter.</th>
                <th className="p-2">Premium</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="p-2 text-left font-semibold">Basic</td>
                <td className="p-2">23.0%</td>
                <td className="p-2">27.3%</td>
                <td className="p-2">31.8%</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-2 text-left font-semibold">Inter.</td>
                <td className="p-2">12.5%</td>
                <td className="p-2">9.1%</td>
                <td className="p-2">Upgrade</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-2 text-left font-semibold">Prem.</td>
                <td className="p-2">6.1%</td>
                <td className="p-2">2.4%</td>
                <td className="p-2">8.5%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 rounded-md bg-muted p-3">
          <p className="type-body-s-semibold">Trade-off</p>
          <p className="mt-1 type-body-s text-muted-foreground">{RATE_BANDS.editBand.tradeOff}</p>
        </div>
      </ModalShell>
    </div>
  );
}
