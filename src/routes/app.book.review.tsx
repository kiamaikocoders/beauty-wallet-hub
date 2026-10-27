import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useMember } from "@/components/app/MemberContext";
import { buttonClass } from "@/components/site/primitives";
import { createBooking, loadAppProvider } from "@/lib/app-data";
import { bookingStudioContact } from "@/lib/command-center";
import { announce } from "@/lib/notices";
import { firstName } from "@/lib/onboarding";
import { ksh, num } from "@/lib/pricing";
import { notifyEmail } from "@/lib/resend";

export const Route = createFileRoute("/app/book/review")({
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    if (!deps.provider) return null;
    return loadAppProvider(deps.provider, deps.demo ?? null);
  },
  component: BookReview,
});

function BookReview() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const { member, demo, refresh } = useMember();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const svc = data?.services.find((s) => s.id === search.service) ?? data?.services[0];
  const addonIds = (search.addons ?? "").split(",").filter(Boolean);
  const addonCoins = (data?.addons ?? [])
    .filter((a) => addonIds.includes(a.id))
    .reduce((t, a) => t + a.coins, 0);
  const total = (svc?.coins ?? 0) + addonCoins;
  const when = search.when ? new Date(search.when) : null;

  if (!data || !svc || !member || !when) {
    return (
      <p>
        Missing booking details.{" "}
        <Link to="/app/explore" search={(demo ? { demo } : {}) as never} className="text-burgundy">
          Explore
        </Link>
      </p>
    );
  }

  const whenLabel = when.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const end = new Date(when.getTime() + svc.minutes * 60_000);
  const freeUntil = new Date(when.getTime() - 24 * 3_600_000);

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="type-h2">Confirm your booking</h2>
      <dl className="mt-6 space-y-3 rounded-xl border border-border bg-card p-5 type-body-s">
        <Row l="Service" r={svc.name} />
        <Row l="Where" r={`${data.provider.name}, ${data.provider.area}`} />
        <Row
          l="When"
          r={`${whenLabel} to about ${end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}`}
        />
        <Row l="Stylist" r={search.stylist ?? "Any stylist"} />
        <Row l="Service value" r={ksh(svc.cashKsh)} />
        <Row l={`Your ${member.tierName} rate`} r={`${num(svc.coins)} coins`} />
        <Row l="Add-ons" r={`${addonCoins} coins`} />
        <Row l="Coins held now" r={<b>{num(total)} coins</b>} />
        <Row
          l="Available after booking"
          r={`${num(member.wallet.available)} → ${num(member.wallet.available - total)} coins`}
        />
      </dl>
      <p className="mt-4 type-body-s text-muted-foreground">
        Coins are held, not spent. {data.provider.name} only receives them when you give your
        arrival PIN at the start of your visit.
      </p>
      <p className="mt-2 type-body-s text-muted-foreground">
        Free cancellation until{" "}
        {freeUntil.toLocaleString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}
        . After that, half the held coins go to the provider.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/app/book"
          search={search as never}
          className={buttonClass({ variant: "secondary" })}
        >
          Back
        </Link>
        <button
          type="button"
          disabled={busy}
          className={buttonClass({ variant: "emphasis" })}
          onClick={async () => {
            setBusy(true);
            try {
              const r = await createBooking({
                serviceId: svc.id,
                scheduledAt: when.toISOString(),
                addons: addonIds,
                stylist: search.stylist ?? null,
                demo,
              });
              try {
                const studio = await bookingStudioContact(r.id);
                if (studio?.email) {
                  notifyEmail({
                    to: studio.email,
                    template: "provider-new-booking",
                    data: {
                      firstName: firstName(studio.member),
                      fullName: studio.member,
                      service: studio.service,
                      when: studio.when,
                      stylist: r.stylist ?? "Any available",
                      payout: ksh(studio.payout),
                      ctaUrl: `${window.location.origin}/provider`,
                    },
                  });
                }
              } catch {
                toast.error("Booked, but the studio email could not be prepared");
              }
              if (member.email) {
                const cancelBy = new Date(when.getTime() - 24 * 60 * 60_000);
                notifyEmail({
                  to: member.email,
                  template: "booking-confirmed",
                  data: {
                    firstName: firstName(member.fullName),
                    service: r.serviceName,
                    provider: r.providerName,
                    stylist: r.stylist ?? "Any available",
                    when: whenLabel,
                    coinsHeld: num(r.coins),
                    pin: r.pin,
                    cancelBy: cancelBy.toLocaleString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                    ctaUrl: `${window.location.origin}/app/bookings/${r.id}${demo ? `?demo=${demo}` : ""}`,
                  },
                });
              }
              announce("booking_confirmed", r.id);
              refresh();
              void navigate({
                to: "/app/book/done",
                search: { id: r.id, ...(demo ? { demo } : {}) } as never,
              });
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Could not book";
              if (msg.includes("SLOT_TAKEN")) toast.error("That time was just taken");
              else if (msg.includes("NOT_ENOUGH_COINS")) toast.error("Not enough coins");
              else toast.error(msg);
            } finally {
              setBusy(false);
            }
          }}
        >
          Confirm and hold {num(total)} coins
        </button>
      </div>
    </div>
  );
}

function Row({ l, r }: { l: string; r: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{l}</dt>
      <dd className="text-right">{r}</dd>
    </div>
  );
}
