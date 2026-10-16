import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { BottomSheet } from "@/components/app/Sheets";
import { useMember } from "@/components/app/MemberContext";
import { buttonClass } from "@/components/site/primitives";
import { fetchBookingDetail, rateBooking, reportProblem } from "@/lib/app-data";
import { cn } from "@/lib/utils";

const TAGS = ["On time", "Clean space", "Friendly", "Great result", "Worth the coins"];
const REASONS = [
  "Provider didn’t show up",
  "Service wasn’t what I booked",
  "Asked to pay extra in cash",
  "Felt unsafe or treated badly",
  "Something else",
];

export const Route = createFileRoute("/app/bookings/$id/rate")({
  validateSearch: (raw: Record<string, unknown>) => ({
    demo: typeof raw["demo"] === "string" ? raw["demo"] : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ params, deps }) => fetchBookingDetail(params.id, deps.demo ?? null),
  component: RateVisit,
});

function RateVisit() {
  const booking = Route.useLoaderData();
  const { demo } = useMember();
  const navigate = useNavigate();
  const [rating, setRating] = useState(5);
  const [tags, setTags] = useState<string[]>(["On time", "Clean space"]);
  const [body, setBody] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[1]!);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const when = new Date(booking.scheduledAt).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="mx-auto max-w-lg">
      <p className="type-caption text-muted-foreground">
        {booking.providerName} · {when}
      </p>
      <h1 className="mt-2 type-h2">How was your {booking.serviceName}?</h1>
      <div className="mt-6 flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={cn(
              "size-12 rounded-full border type-h3",
              n <= rating ? "border-gold bg-gold/30" : "border-border bg-card",
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="mt-2 type-body-s text-muted-foreground">
        {rating >= 4 ? "Good" : "Tell us more"}
      </p>

      <p className="mt-8 type-body-s-semibold">What stood out?</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {TAGS.map((t) => {
          const on = tags.includes(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTags((x) => (on ? x.filter((y) => y !== t) : [...x, t]))}
              className={cn(
                "rounded-full border px-3 py-2 type-body-s",
                on ? "border-burgundy bg-blush-subtle" : "border-border",
              )}
            >
              {t}
            </button>
          );
        })}
      </div>

      <label className="mt-8 block">
        <span className="type-body-s-semibold">Anything else? (optional)</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="mt-2 w-full rounded-xl border border-border bg-card p-3 type-body-m"
        />
      </label>

      <p className="mt-4 type-caption text-muted-foreground">
        {booking.coins} coins were released to {booking.providerName} when you gave your PIN.
      </p>

      <button
        type="button"
        className="mt-4 type-body-s text-burgundy"
        onClick={() => setReportOpen(true)}
      >
        Something went wrong? Report a problem
      </button>

      <button
        type="button"
        disabled={busy}
        className={buttonClass({ full: true, className: "mt-6" })}
        onClick={async () => {
          setBusy(true);
          try {
            await rateBooking({ id: booking.id, rating, body, tags, demo });
            toast.success("Thanks for rating");
            void navigate({
              to: "/app/bookings",
              search: { tab: "past", ...(demo ? { demo } : {}) } as never,
            });
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not submit");
          } finally {
            setBusy(false);
          }
        }}
      >
        Submit rating
      </button>

      <BottomSheet open={reportOpen} onClose={() => setReportOpen(false)}>
        <h2 className="type-h2">Report a problem</h2>
        <p className="mt-2 type-body-s text-muted-foreground">
          {booking.serviceName} · {booking.providerName} · {when} · {booking.coins} coins
        </p>
        <p className="mt-5 type-body-s-semibold">What went wrong?</p>
        <ul className="mt-2 space-y-2">
          {REASONS.map((r) => (
            <label key={r} className="flex items-center gap-2 type-body-s">
              <input type="radio" checked={reason === r} onChange={() => setReason(r)} />
              {r}
            </label>
          ))}
        </ul>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what happened"
          rows={4}
          className="mt-4 w-full rounded-xl border border-border bg-background p-3 type-body-m"
        />
        <p className="mt-2 type-caption text-muted-foreground">
          We reply within 24 hours. If we agree, the {booking.coins} coins come back to your wallet.
        </p>
        <button
          type="button"
          className={buttonClass({ full: true, className: "mt-4" })}
          onClick={async () => {
            try {
              const r = await reportProblem({
                id: booking.id,
                reason,
                message,
                demo,
              });
              toast.success(`Report ${r.code} sent`);
              setReportOpen(false);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Could not send");
            }
          }}
        >
          Send report
        </button>
        <Link
          to="/app/bookings/$id"
          params={{ id: booking.id }}
          search={(demo ? { demo } : {}) as never}
          className={buttonClass({ variant: "ghost", full: true, className: "mt-2" })}
        >
          Back
        </Link>
      </BottomSheet>
    </div>
  );
}
