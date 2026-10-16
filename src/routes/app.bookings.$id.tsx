import { Link, createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { toast } from "sonner";
import { CancelSheet } from "@/components/app/Sheets";
import { useMember } from "@/components/app/MemberContext";
import { buttonClass, Icon } from "@/components/site/primitives";
import {
  cancelBooking,
  fetchBookingDetail,
  formatWhen,
  refreshPin,
  relativeInHours,
} from "@/lib/app-data";
import { coinsLabel } from "@/lib/app-data";
import { firstName } from "@/lib/onboarding";
import { num } from "@/lib/pricing";
import { notifyEmail } from "@/lib/resend";

export const Route = createFileRoute("/app/bookings/$id")({
  validateSearch: (raw: Record<string, unknown>) => ({
    demo: typeof raw["demo"] === "string" ? raw["demo"] : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ params, deps }) => fetchBookingDetail(params.id, deps.demo ?? null),
  component: BookingDetailLayout,
});

function BookingDetailLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.endsWith("/rate")) return <Outlet />;
  return <BookingDetail />;
}

function BookingDetail() {
  const booking = Route.useLoaderData();
  const { member, demo, refresh } = useMember();
  const [pin, setPin] = useState(booking.pin ?? "····");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!member) return null;

  const late = Boolean(booking.lateCancel);
  const when = formatWhen(booking.scheduledAt);

  return (
    <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2">
      <div>
        <Link
          to="/app/bookings"
          search={(demo ? { demo } : {}) as never}
          className="type-body-s text-burgundy"
        >
          ← All bookings
        </Link>
        <div className="mt-4 flex items-center justify-between">
          <p className="type-caption text-muted-foreground">{when}</p>
          <p className="type-caption">{relativeInHours(booking.scheduledAt)}</p>
        </div>
        <h1 className="mt-2 type-h1">{booking.serviceName}</h1>
        <dl className="mt-6 space-y-3 type-body-s">
          <Row l="Service" r={booking.serviceName} />
          <Row l="Where" r={`${booking.providerName}, ${booking.providerArea}`} />
          <Row l="When" r={when} />
          <Row l="Coins on hold" r={coinsLabel(booking.coins)} />
        </dl>
        <ol className="mt-8 space-y-3">
          <p className="type-body-s-semibold">At the salon</p>
          {[
            "Arrive and open this pass",
            `${booking.providerName} enters your PIN, which releases ${booking.coins} coins`,
            "Rate your visit afterwards",
          ].map((t, i) => (
            <li key={i} className="flex gap-3 type-body-s">
              <span className="flex size-7 items-center justify-center rounded-full bg-muted type-caption">
                {i + 1}
              </span>
              {t}
            </li>
          ))}
        </ol>
        {late && booking.status !== "cancelled" && booking.status !== "done" && (
          <p className="mt-6 rounded-xl border border-rose bg-blush-subtle p-4 type-body-s">
            Your visit is less than 24 hours away. Cancelling now sends{" "}
            {Math.round(booking.coins / 2)} of the held coins to {booking.providerName}.
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(booking.providerName + " " + booking.providerArea)}`}
            className={buttonClass({ size: "s", variant: "secondary" })}
          >
            Directions
          </a>
          {booking.status === "done" && !booking.rated && (
            <Link
              to="/app/bookings/$id/rate"
              params={{ id: booking.id }}
              search={(demo ? { demo } : {}) as never}
              className={buttonClass({ size: "s" })}
            >
              Rate visit
            </Link>
          )}
          {["booked", "arriving"].includes(booking.status) && (
            <button
              type="button"
              onClick={() => setCancelOpen(true)}
              className={buttonClass({ size: "s", variant: "ghost" })}
            >
              Cancel booking
            </button>
          )}
        </div>
      </div>

      {["booked", "arriving", "in_progress"].includes(booking.status) && (
        <div className="rounded-xl border border-border bg-card p-6 text-center shadow-soft">
          <p className="type-caption uppercase tracking-widest text-muted-foreground">
            Arrival pass · {booking.providerName}
          </p>
          <p className="mt-4 font-display text-6xl tracking-[0.3em]">{pin}</p>
          <div className="mx-auto mt-4 w-fit rounded-xl bg-background p-3">
            <QRCodeSVG value={`BW:${booking.id}:${pin}`} size={140} />
          </div>
          <p className="mt-4 type-body-s text-muted-foreground">
            {when} · {booking.coins} coins on hold
          </p>
          <p className="mt-2 type-caption text-muted-foreground">
            The PIN refreshes every 30 minutes. Screenshots of old PINs won’t work.
          </p>
          <button
            type="button"
            className="mt-3 inline-flex items-center gap-2 type-body-s text-burgundy"
            onClick={async () => {
              try {
                const r = await refreshPin(booking.id, demo);
                setPin(r.pin);
                toast.success("PIN refreshed");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not refresh");
              }
            }}
          >
            <Icon name="refresh" size={16} /> Refresh PIN
          </button>
        </div>
      )}

      <CancelSheet
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        late={late}
        serviceName={booking.serviceName}
        whereWhen={`${booking.providerName} · ${when}`}
        coins={booking.coins}
        available={member.wallet.available}
        providerName={booking.providerName}
        busy={busy}
        onConfirm={async () => {
          setBusy(true);
          try {
            const result = await cancelBooking(booking.id, demo);
            if (member.email) {
              notifyEmail({
                to: member.email,
                template: "booking-cancelled",
                data: {
                  firstName: firstName(member.fullName),
                  service: booking.serviceName,
                  provider: booking.providerName,
                  when,
                  cancelBy: when,
                  coinsReturned: result.late
                    ? `+${num(result.returned)} (${num(result.toProvider)} to provider)`
                    : `+${num(result.returned)}`,
                  available: num(member.wallet.available + result.returned),
                  ctaUrl: `${window.location.origin}/app/explore${demo ? `?demo=${demo}` : ""}`,
                },
              });
            }
            toast.success("Booking cancelled");
            refresh();
            setCancelOpen(false);
            window.location.href = `/app/bookings${demo ? `?demo=${demo}` : ""}`;
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not cancel");
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}

function Row({ l, r }: { l: string; r: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2">
      <dt className="text-muted-foreground">{l}</dt>
      <dd>{r}</dd>
    </div>
  );
}
