import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Delete } from "lucide-react";
import { MomentLottie } from "@/components/site/MomentLottie";
import { toast } from "sonner";
import { ProviderShell } from "@/components/provider/ProviderShell";
import { StatusPill } from "@/components/provider/StatusPill";
import { usePortal } from "@/components/provider/portal-context";
import { buttonClass } from "@/components/site/primitives";
import {
  checkInPin,
  completeVisit,
  firstName,
  formatTime,
  initials,
  ksh,
  payoutWeek,
  serviceLabel,
  startVisit,
  tierLabel,
  todayBookings,
  type CheckInResult,
  type StartVisitResult,
} from "@/lib/provider-portal-data";

export const Route = createFileRoute("/provider/check-in")({
  component: CheckInPage,
});

type Phase =
  | { kind: "idle" }
  | { kind: "wrong" }
  | { kind: "expired"; member?: string | undefined; pinTime?: string | undefined }
  | { kind: "matched"; match: Extract<CheckInResult, { ok: true }> }
  | { kind: "started"; result: StartVisitResult };

function CheckInPage() {
  const data = usePortal();
  const [digits, setDigits] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [busy, setBusy] = useState(false);
  const visits = todayBookings(data.bookings).sort(
    (a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at),
  );
  const expected = visits.filter((v) => ["booked", "arriving"].includes(v.status));
  const checked = visits.filter((v) => ["in_progress", "done"].includes(v.status));
  const week = payoutWeek(data.bookings) || 62400;

  const pushDigit = (d: string) => {
    if (digits.length >= 4 || busy) return;
    const next = digits + d;
    setDigits(next);
    if (phase.kind === "wrong" || phase.kind === "expired") setPhase({ kind: "idle" });
    if (next.length === 4) void submit(next);
  };

  const backspace = () => {
    setDigits((d) => d.slice(0, -1));
    if (phase.kind === "wrong" || phase.kind === "expired") setPhase({ kind: "idle" });
  };

  const submit = async (pin = digits) => {
    if (pin.length !== 4 || busy) return;
    setBusy(true);
    try {
      const res = await checkInPin(pin, data.provider.slug);
      if (!res.ok) {
        if (res.error === "expired") {
          const next: Phase = { kind: "expired" };
          if (res.member_name) next.member = res.member_name;
          if (res.pin_time) next.pinTime = res.pin_time;
          setPhase(next);
        } else {
          setPhase({ kind: "wrong" });
        }
        return;
      }
      setPhase({ kind: "matched", match: res });
    } finally {
      setBusy(false);
    }
  };

  const onStart = async () => {
    if (phase.kind !== "matched") return;
    setBusy(true);
    try {
      const result = await startVisit(phase.match.booking_id, data.provider.slug);
      setPhase({ kind: "started", result });
      setDigits("");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setDigits("");
    setPhase({ kind: "idle" });
  };

  if (phase.kind === "started") {
    const started = phase.result;
    return (
      <ProviderShell data={data} hideSearch>
        <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center text-center">
          <MomentLottie name="check" size={72} />
          <h2 className="mt-5 font-display text-[32px]">Visit started</h2>
          <p className="mt-2 type-body-m text-muted-foreground">
            {started.member_name} · {started.services} with Wanjiku
          </p>
          <div className="mt-8 w-full rounded-[20px] border border-border bg-card p-5 text-left">
            <Row label="Checked in" value={formatTime(started.checked_in_at)} />
            <Row label="Booked for" value={`${started.promised_minutes ?? 60} min`} />
            <Row label="Added to payout" value={ksh(started.payout_ksh)} />
            <Row label="Tue 13 Oct payout so far" value={ksh(week + started.payout_ksh)} />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void completeVisit(started.booking_id, data.provider.slug)
                .then((result) => {
                  toast(
                    result.overrun_minutes > 0
                      ? `Finished ${result.overrun_minutes} min over the booked time`
                      : "Visit finished on time",
                  );
                  reset();
                })
                .catch(() => toast.error("Could not finish this visit"))
                .finally(() => setBusy(false));
            }}
            className={buttonClass({ className: "mt-6 w-full" })}
          >
            Finish visit
          </button>
          <Link to="/provider" className={buttonClass({ variant: "secondary", className: "mt-3 w-full" })}>
            Back to today
          </Link>
          <button
            type="button"
            onClick={reset}
            className={buttonClass({ variant: "secondary", className: "mt-3 w-full" })}
          >
            Check in another visit
          </button>
        </div>
      </ProviderShell>
    );
  }

  return (
    <ProviderShell data={data}>
      <div className="mx-auto grid max-w-5xl gap-8 pt-4 lg:grid-cols-[1fr_340px] lg:pt-8">
        <section className="rounded-[24px] border border-border bg-card p-6 lg:p-8">
          <h2 className="font-display text-[28px] leading-none">
            <span className="lg:hidden">Enter the member’s PIN</span>
            <span className="hidden lg:inline">Check in a visit</span>
          </h2>
          <p className="mt-3 type-body-m text-muted-foreground">
            <span className="lg:hidden">It’s on their arrival pass in Beauty Wallet.</span>
            <span className="hidden lg:inline">
              Ask the member to open their arrival pass in Beauty Wallet and read you the 4-digit
              PIN. Checking in releases their coins to you.
            </span>
          </p>

          <div className="mt-8 flex justify-center gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="grid size-14 place-items-center rounded-2xl border border-border bg-background font-display text-3xl lg:size-16"
              >
                {digits[i] ?? ""}
              </div>
            ))}
          </div>

          {phase.kind === "wrong" && (
            <p className="mt-4 text-center type-body-s text-destructive">
              That PIN doesn’t match a visit today. Ask the member to pull down on their pass to
              refresh it, then try again.
            </p>
          )}
          {phase.kind === "expired" && (
            <p className="mt-4 text-center type-body-s text-destructive">
              This PIN has expired
              {phase.member
                ? `. This PIN is from ${phase.member}’s pass at ${phase.pinTime ?? "earlier"}. Ask her to open the pass again for a fresh one.`
                : ". Ask the member to open their pass again for a fresh one."}
            </p>
          )}

          <p className="mt-4 text-center type-body-s text-muted-foreground lg:hidden">
            Refreshes every 30 minutes
          </p>

          <div className="mx-auto mt-6 grid max-w-xs grid-cols-3 gap-3 lg:hidden">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((key) =>
              key === "" ? (
                <span key="pad" />
              ) : key === "del" ? (
                <button
                  key="del"
                  type="button"
                  onClick={backspace}
                  className="grid h-14 place-items-center rounded-2xl bg-muted"
                  aria-label="Delete"
                >
                  <Delete className="size-5" />
                </button>
              ) : (
                <button
                  key={key}
                  type="button"
                  onClick={() => pushDigit(key)}
                  className="h-14 rounded-2xl bg-muted font-display text-2xl"
                >
                  {key}
                </button>
              ),
            )}
          </div>

          <div className="mt-8 hidden lg:block">
            <p className="type-body-s text-muted-foreground">Enter the member’s PIN</p>
            <div className="mt-3 flex gap-3">
              <input
                inputMode="numeric"
                maxLength={4}
                value={digits}
                onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="h-12 w-40 rounded-full border border-border bg-background px-5 font-display text-2xl tracking-[0.4em] outline-none"
                placeholder="····"
              />
              <button
                type="button"
                disabled={digits.length !== 4 || busy}
                onClick={() => void submit()}
                className={buttonClass()}
              >
                Check PIN
              </button>
            </div>
            <p className="mt-4 type-body-s text-muted-foreground">
              PINs refresh every 30 minutes, so an old screenshot won’t match.
            </p>
          </div>
        </section>

        <aside className="hidden space-y-5 lg:block">
          <section className="rounded-[20px] border border-border bg-card p-5">
            <h3 className="type-eyebrow text-muted-foreground">Expected next</h3>
            <ul className="mt-4 space-y-4">
              {expected.slice(0, 3).map((v) => (
                <li key={v.id} className="flex gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted type-body-s-semibold">
                    {initials(v.member_name)}
                  </span>
                  <div className="min-w-0">
                    <p className="type-body-s-medium">
                      {formatTime(v.scheduled_at)} · {v.member_name}
                    </p>
                    <p className="truncate type-body-s text-muted-foreground">
                      {serviceLabel(v)} · {v.stylist}
                    </p>
                    <div className="mt-1">
                      <StatusPill status={v.status} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-[20px] border border-border bg-card p-5">
            <h3 className="type-eyebrow text-muted-foreground">Checked in today</h3>
            <ul className="mt-4 space-y-3">
              {checked.slice(0, 4).map((v) => (
                <li key={v.id} className="flex justify-between gap-3 type-body-s">
                  <span>{v.member_name}</span>
                  <span className="text-muted-foreground">PIN · {ksh(v.payout_ksh)}</span>
                </li>
              ))}
              {checked.length === 0 && (
                <li className="type-body-s text-muted-foreground">No check-ins yet.</li>
              )}
            </ul>
          </section>
        </aside>
      </div>

      {phase.kind === "matched" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 lg:items-center lg:p-6">
          <div className="w-full max-w-md rounded-t-[28px] bg-card p-6 lg:rounded-[28px]">
            <p className="type-eyebrow text-success">PIN matches</p>
            <div className="mt-4 flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-full bg-muted type-body-m-medium">
                {initials(phase.match.member_name)}
              </span>
              <div>
                <p className="font-display text-2xl">{phase.match.member_name}</p>
                <p className="type-body-s text-muted-foreground">
                  {tierLabel(phase.match.member_tier)}
                </p>
              </div>
            </div>
            <dl className="mt-6 space-y-3">
              <Row label="Service" value={`${phase.match.services} · ${phase.match.minutes} min`} />
              <Row label="Stylist" value="Wanjiku" />
              <Row label="Booked for" value={`Today, ${formatTime(phase.match.scheduled_at)}`} />
              <Row label="Your payout" value={ksh(phase.match.payout_ksh)} />
            </dl>
            <p className="mt-4 type-body-s text-muted-foreground">
              {firstName(phase.match.member_name)}’s coins are released when you start.{" "}
              {ksh(phase.match.payout_ksh)} joins your Tue 13 Oct payout.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void onStart()}
              className={buttonClass({ full: true, className: "mt-6" })}
            >
              Start visit
            </button>
            <button
              type="button"
              onClick={reset}
              className={buttonClass({ variant: "ghost", full: true, className: "mt-2" })}
            >
              Not this member
            </button>
          </div>
        </div>
      )}
    </ProviderShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2 last:border-0">
      <dt className="type-body-s text-muted-foreground">{label}</dt>
      <dd className="text-right type-body-s-medium">{value}</dd>
    </div>
  );
}
