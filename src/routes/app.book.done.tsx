import { Link, createFileRoute } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { toast } from "sonner";
import { useMember } from "@/components/app/MemberContext";
import { MomentLottie } from "@/components/site/MomentLottie";
import { buttonClass, Icon } from "@/components/site/primitives";
import { fetchBookingDetail, firstName, refreshPin } from "@/lib/app-data";
import { num } from "@/lib/pricing";

export const Route = createFileRoute("/app/book/done")({
  validateSearch: (raw: Record<string, unknown>) => ({
    demo: typeof raw["demo"] === "string" ? raw["demo"] : undefined,
    id: typeof raw["id"] === "string" ? raw["id"] : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    if (!deps.id) return null;
    return fetchBookingDetail(deps.id, deps.demo ?? null);
  },
  component: BookDone,
});

function BookDone() {
  const booking = Route.useLoaderData();
  const { member, demo } = useMember();
  const [pin, setPin] = useState(booking?.pin ?? "····");

  if (!booking || !member) {
    return (
      <Link to="/app/bookings" search={(demo ? { demo } : {}) as never} className="text-burgundy">
        View bookings
      </Link>
    );
  }

  const when = new Date(booking.scheduledAt).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2">
      <div>
        <MomentLottie name="check" size={72} />
        <p className="mt-4 type-eyebrow text-burgundy">Booking confirmed</p>
        <h2 className="mt-2 type-h1">You’re booked, {firstName(member.fullName)}.</h2>
        <p className="mt-3 type-body-m text-muted-foreground">
          {booking.serviceName} at {booking.providerName}, {when}. We’ll remind you the day before.
        </p>
        <p className="mt-4 type-body-s">
          {num(member.wallet.available)} coins available · {num(member.wallet.onHold)} on hold
        </p>
        <p className="mt-2 type-caption text-muted-foreground">
          Your arrival PIN is also sent by SMS on the morning of your visit. Show it when you
          arrive.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(booking.serviceName)}&dates=`}
            className={buttonClass({ variant: "secondary" })}
          >
            Add to calendar
          </a>
          <Link
            to="/app/bookings"
            search={(demo ? { demo } : {}) as never}
            className={buttonClass()}
          >
            View bookings
          </Link>
        </div>
      </div>
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
    </div>
  );
}
