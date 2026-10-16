import { TEAMS_DEMO } from "@/lib/teams-demo";
import { TeamsShell, initialsAvatar } from "./TeamsShell";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border py-3 last:border-0">
      <span className="type-body-s text-muted-foreground">{label}</span>
      <span className="type-body-s-medium text-right">{value}</span>
    </div>
  );
}

function Toggle({
  label,
  help,
  defaultChecked,
}: {
  label: string;
  help: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-start justify-between gap-4 border-b border-border py-4 last:border-0">
      <span>
        <span className="block type-body-s-medium">{label}</span>
        <span className="block type-caption text-muted-foreground">{help}</span>
      </span>
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-1 size-5 accent-burgundy"
      />
    </label>
  );
}

export function TeamsSettings() {
  const d = TEAMS_DEMO;
  return (
    <TeamsShell title="Settings">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="type-h4">Company</h2>
          </div>
          <Row label="Name" value={d.companyLegal} />
          <Row label="Billing email" value={d.billingEmail} />
          <Row label="HR contact" value={d.hrEmail} />
          <Row label="Phone" value={d.hrPhone} />
          <Row label="Address" value={d.address} />
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="type-h4">HR admins</h2>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              {initialsAvatar("LN")}
              <div>
                <p className="type-body-s-medium">{d.hrName} (you)</p>
                <p className="type-caption text-muted-foreground">HR manager · {d.hrPhone}</p>
              </div>
              <span className="ml-auto type-caption text-gold-foreground">Owner</span>
            </div>
            <div className="flex items-center gap-3">
              {initialsAvatar("AM")}
              <div>
                <p className="type-body-s-medium">Aisha Mohamed</p>
                <p className="type-caption text-muted-foreground">HR officer · 0710 448 290</p>
              </div>
              <span className="ml-auto type-caption text-muted-foreground">Admin</span>
            </div>
          </div>
          <p className="type-caption mt-4 text-muted-foreground">
            Admins can invite staff, change tiers and pay invoices.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="type-h4">Payment</h2>
          </div>
          <Row label="M-Pesa" value={`${d.hrPhone} · default`} />
          <Row label="Card" value="Visa ending 4410" />
          <Toggle
            label="Pay automatically on the 1st"
            help={`We send an M-Pesa prompt to ${d.hrPhone}`}
            defaultChecked
          />
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="type-h4 mb-2">Staff rules</h2>
          <Toggle
            label="Staff can top up with their own money"
            help="Top-ups are paid by them, not the company"
            defaultChecked
          />
          <Toggle
            label="Remind staff who haven’t booked by the 20th"
            help="A friendly SMS, sent from Beauty Wallet"
            defaultChecked
          />
          <Toggle
            label="Weekly usage summary"
            help={`Every Monday to ${d.hrEmail}`}
            defaultChecked
          />
        </section>
      </div>
    </TeamsShell>
  );
}
