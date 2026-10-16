import { buttonClass } from "@/components/site/primitives";
import { TEAMS_DEMO } from "@/lib/teams-demo";
import { ksh } from "@/lib/pricing";
import { TeamsShell, StatTile } from "./TeamsShell";

export function TeamsInvoices() {
  const d = TEAMS_DEMO;
  return (
    <TeamsShell title="Invoices" searchPlaceholder="Search invoices">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Next invoice"
          value={ksh(d.nextInvoiceKsh)}
          sub={`Due ${d.nextInvoiceDate}`}
        />
        <StatTile label="Paid so far" value={ksh(d.paidSoFar)} sub="Since Aug 2026" />
        <StatTile
          label="Seats billed"
          value={String(d.seats)}
          sub="8 Basic · 10 Intermediate · 2 Premium"
        />
      </div>

      <section className="mt-6 rounded-lg border border-border bg-card p-5">
        <p className="type-eyebrow text-burgundy">November invoice</p>
        <p className="type-h3 mt-2">
          {ksh(d.nextInvoiceKsh)} due {d.nextInvoiceDate}
        </p>
        <p className="type-body-s mt-2 text-muted-foreground">
          Pay by M-Pesa or card. Staff coins renew as soon as it’s paid.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className={buttonClass({ variant: "secondary", size: "s" })}>
            Download estimate
          </button>
          <button type="button" className={buttonClass({ variant: "emphasis", size: "s" })}>
            Pay now
          </button>
        </div>
      </section>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-border type-label-s text-muted-foreground">
              <th className="px-4 py-3 font-bold">Invoice</th>
              <th className="px-4 py-3 font-bold">Period</th>
              <th className="px-4 py-3 font-bold">Seats</th>
              <th className="px-4 py-3 font-bold">Amount</th>
              <th className="px-4 py-3 font-bold">Paid with</th>
              <th className="px-4 py-3 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {d.invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 type-body-s-medium">{inv.number}</td>
                <td className="px-4 py-3 type-body-s">{inv.period}</td>
                <td className="px-4 py-3 type-body-s">{inv.seats} seats</td>
                <td className="px-4 py-3 type-body-s">{ksh(inv.amountKsh)}</td>
                <td className="px-4 py-3 type-body-s">{inv.paidWith}</td>
                <td className="px-4 py-3 type-body-s text-success">{inv.statusLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="type-caption mt-4 text-muted-foreground">
        Invoices also go to {d.billingEmail} on the 1st of each month.
      </p>
    </TeamsShell>
  );
}
