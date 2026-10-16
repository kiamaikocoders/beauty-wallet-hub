import { createFileRoute } from "@tanstack/react-router";
import { ProviderShell } from "@/components/provider/ProviderShell";
import { usePortal } from "@/components/provider/portal-context";
import { buttonClass } from "@/components/site/primitives";
import { tierLabel } from "@/lib/provider-portal-data";

export const Route = createFileRoute("/provider/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const data = usePortal();
  const p = data.provider;

  return (
    <ProviderShell
      data={data}
      topAction={
        <button type="button" className={buttonClass({ size: "s" })}>
          Save changes
        </button>
      }
    >
      <div className="mx-auto max-w-3xl space-y-5 pt-4 lg:pt-7">
        <section className="rounded-[20px] border border-border bg-card p-5">
          <h2 className="type-body-m-medium">Business details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Business name" defaultValue={p.name} />
            <Field label="Category" defaultValue={p.kind ?? "Braiding salon"} />
            <Field label="Address" defaultValue={`${p.area}, Nairobi`} />
            <Field label="Bookings phone" defaultValue="0711 482 093" />
          </div>
        </section>

        <section className="rounded-[20px] border border-border bg-card p-5">
          <h2 className="type-body-m-medium">Photos</h2>
          <p className="mt-2 type-body-s text-muted-foreground">
            The first photo shows on Explore. Use real work from your studio.
          </p>
          <button
            type="button"
            className={buttonClass({ size: "s", variant: "secondary", className: "mt-4" })}
          >
            Add photos
          </button>
        </section>

        <section className="rounded-[20px] border border-border bg-card p-5">
          <p className="type-eyebrow text-muted-foreground">Your class</p>
          <p className="mt-2 font-display text-3xl">{tierLabel(p.class)}</p>
          <p className="mt-2 type-body-s text-muted-foreground">
            Payout rate · {Math.round(p.payout_pct * 100)}% of cash price
          </p>
          <p className="mt-3 type-body-s text-muted-foreground">
            Beauty Wallet reviews class every quarter using ratings, prices and service range. Next
            review: January.
          </p>
        </section>

        <section className="rounded-[20px] border border-border bg-card p-5">
          <h2 className="type-body-m-medium">Documents</h2>
          <ul className="mt-4 space-y-3">
            {(p.kyc_docs.length
              ? p.kyc_docs
              : ["Single business permit", "KRA PIN certificate", "Owner ID"]
            ).map((doc) => (
              <li key={doc} className="flex items-center justify-between gap-3 type-body-s">
                <div>
                  <p className="type-body-s-medium">{doc}</p>
                  <p className="text-muted-foreground">{p.owner_name ?? "Mercy Wambui"}</p>
                </div>
                <span className="rounded-full bg-success-bg px-2.5 py-1 type-body-s text-success">
                  Verified
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[20px] border border-border bg-card p-5">
          <h2 className="type-body-m-medium">Alerts</h2>
          <ul className="mt-4 space-y-3 type-body-s">
            <li className="flex justify-between gap-3">
              <span>SMS for new bookings</span>
              <span className="text-muted-foreground">To 0711 482 093</span>
            </li>
            <li className="flex justify-between gap-3">
              <span>Weekly statement by email</span>
              <span className="text-muted-foreground">Every Tuesday</span>
            </li>
          </ul>
        </section>
      </div>
    </ProviderShell>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <label className="block">
      <span className="type-body-s text-muted-foreground">{label}</span>
      <input
        defaultValue={defaultValue}
        className="mt-1.5 h-12 w-full rounded-2xl border border-border bg-background px-4 outline-none"
      />
    </label>
  );
}
