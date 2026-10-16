import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ProviderShell } from "@/components/provider/ProviderShell";
import { StatusPill } from "@/components/provider/StatusPill";
import { usePortal } from "@/components/provider/portal-context";
import { buttonClass } from "@/components/site/primitives";
import {
  formatTime,
  initials,
  ksh,
  markNoShow,
  minutesFor,
  serviceLabel,
  tierLabel,
} from "@/lib/provider-portal-data";

export const Route = createFileRoute("/provider/bookings/$id")({
  component: BookingDetailPage,
});

function BookingDetailPage() {
  const { id } = Route.useParams();
  const data = usePortal();
  const booking = data.bookings.find((b) => b.id === id);
  const [confirmNoShow, setConfirmNoShow] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!booking) {
    return (
      <ProviderShell data={data} title="Booking">
        <div className="py-20 text-center">
          <p className="font-display text-2xl">Booking not found</p>
          <Link to="/provider" className={buttonClass({ className: "mt-6" })}>
            Back to today
          </Link>
        </div>
      </ProviderShell>
    );
  }

  const half = Math.round(booking.payout_ksh * 0.5);
  const end = new Date(+new Date(booking.scheduled_at) + minutesFor(booking) * 60_000);

  const onNoShow = async () => {
    setBusy(true);
    try {
      const res = await markNoShow(booking.id, data.provider.slug);
      toast.success(`Marked no-show · ${ksh(res.payout_ksh)} payout`);
      setConfirmNoShow(false);
    } catch {
      toast.error("Could not mark no-show");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ProviderShell data={data} title={serviceLabel(booking)}>
      <div className="mx-auto max-w-3xl pt-4 lg:pt-8">
        <Link to="/provider/calendar" className="type-body-s-medium text-burgundy">
          ← Calendar
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-[32px] leading-none">{serviceLabel(booking)}</h2>
            <div className="mt-3">
              <StatusPill status={booking.status} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-[20px] border border-border bg-card p-4">
          <span className="grid size-12 place-items-center rounded-full bg-muted type-body-m-medium">
            {initials(booking.member_name)}
          </span>
          <div>
            <p className="type-body-m-medium">{booking.member_name}</p>
            <p className="type-body-s text-muted-foreground">
              {tierLabel(booking.member_tier)} member
            </p>
          </div>
        </div>

        <dl className="mt-4 space-y-0 rounded-[20px] border border-border bg-card px-5">
          <Detail
            label="Date"
            value={`${formatTime(booking.scheduled_at)} to ${formatTime(end.toISOString())}`}
          />
          <Detail label="Stylist" value={booking.stylist ?? "Wanjiku"} />
          <Detail
            label="Add-ons"
            value={booking.addons?.length ? booking.addons.join(", ") : "None"}
          />
          <Detail label="Booked" value="Today" />
        </dl>

        <section className="mt-4 rounded-[20px] border border-border bg-card p-5">
          <p className="type-eyebrow text-muted-foreground">Your payout</p>
          <p className="mt-2 font-display text-[32px]">{ksh(booking.payout_ksh)}</p>
          <p className="mt-2 type-body-s text-muted-foreground">
            {Math.round(data.provider.payout_pct * 100)}% of {ksh(booking.cash_ksh)}. Paid after
            check-in.
          </p>
        </section>

        <section className="mt-4 rounded-[20px] border border-border bg-card p-5">
          <h3 className="type-body-m-medium">If plans change</h3>
          <ul className="mt-3 space-y-2 type-body-s">
            <li className="flex justify-between gap-3">
              <span className="text-muted-foreground">Member cancels with notice</span>
              <span>{ksh(0)}</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-muted-foreground">Member cancels later</span>
              <span>{ksh(half)}</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-muted-foreground">No-show after 20 min</span>
              <span>{ksh(half)}</span>
            </li>
          </ul>
        </section>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link to="/provider/check-in" className={buttonClass({ className: "flex-1" })}>
            Check in with PIN
          </Link>
          {["booked", "arriving"].includes(booking.status) && (
            <button
              type="button"
              onClick={() => setConfirmNoShow(true)}
              className={buttonClass({ variant: "secondary", className: "flex-1" })}
            >
              Mark no-show
            </button>
          )}
        </div>
      </div>

      {confirmNoShow && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 lg:items-center lg:p-6">
          <div className="w-full max-w-md rounded-t-[28px] bg-card p-6 lg:rounded-[28px]">
            <h3 className="font-display text-2xl">Mark as a no-show?</h3>
            <div className="mt-4 flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-muted type-body-s-semibold">
                {initials(booking.member_name)}
              </span>
              <div>
                <p className="type-body-m-medium">{booking.member_name}</p>
                <p className="type-body-s text-muted-foreground">
                  {serviceLabel(booking)} · booked {formatTime(booking.scheduled_at)}
                </p>
              </div>
            </div>
            <p className="mt-4 type-body-m text-muted-foreground">
              We’ll text them before closing the booking. You receive {ksh(half)} — half of their
              held coins.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void onNoShow()}
              className={buttonClass({ full: true, className: "mt-6" })}
            >
              Mark no-show
            </button>
            <button
              type="button"
              onClick={() => setConfirmNoShow(false)}
              className={buttonClass({ variant: "ghost", full: true, className: "mt-2" })}
            >
              Keep waiting
            </button>
          </div>
        </div>
      )}
    </ProviderShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-3 last:border-0">
      <dt className="type-body-s text-muted-foreground">{label}</dt>
      <dd className="text-right type-body-s-medium">{value}</dd>
    </div>
  );
}
