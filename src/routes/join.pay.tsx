import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { OnboardingShell, OrderSummaryCard } from "@/components/site/auth/OnboardingShell";
import { AuthCheckbox, Field, TextInput } from "@/components/site/auth/auth-fields";
import { Icon, buttonClass } from "@/components/site/primitives";
import { fetchRules } from "@/lib/catalog";
import {
  displayPhone,
  formatRenewal,
  loadOnboarding,
  renewalDate,
  saveOnboarding,
} from "@/lib/onboarding";
import { createPaymentIntent, updatePaymentStatus } from "@/lib/payments";
import { ksh, num, type TierId } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/join/pay")({
  loader: async () => ({ rules: await fetchRules() }),
  head: () => ({
    meta: [
      { title: "Payment — Beauty Wallet" },
      {
        name: "description",
        content: "Pay for your first month. Your plan renews monthly on the same date.",
      },
    ],
  }),
  component: PayPage,
});

type Phase = "form" | "pending" | "failed";

function PayPage() {
  const { rules } = Route.useLoaderData();
  const navigate = useNavigate();
  const onboarding = loadOnboarding();
  const tier = (onboarding.tier ?? "intermediate") as TierId;
  const t = rules.tiers[tier];
  const renews = renewalDate();

  const [method, setMethod] = useState<"mpesa" | "card">(onboarding.paymentMethod);
  const [mpesaPhone, setMpesaPhone] = useState(
    onboarding.mpesaPhone || onboarding.phone || "0712 345 678",
  );
  const [cardName, setCardName] = useState(onboarding.fullName || "");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [saveCard, setSaveCard] = useState(true);
  const [phase, setPhase] = useState<Phase>(
    onboarding.paymentStatus === "pending" ? "pending" : "form",
  );
  const [busy, setBusy] = useState(false);
  const [paymentId, setPaymentId] = useState(onboarding.paymentId);
  const [waitLeft, setWaitLeft] = useState(48);
  const [failReason, setFailReason] = useState<string | null>(null);

  useEffect(() => {
    if (phase !== "pending") return;
    if (waitLeft <= 0) return;
    const timer = window.setTimeout(() => setWaitLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, waitLeft]);

  // Mock STK success after ~5s if still pending
  useEffect(() => {
    if (phase !== "pending" || !paymentId) return;
    const tmr = window.setTimeout(() => {
      void completeSuccess(paymentId);
    }, 5000);
    return () => window.clearTimeout(tmr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, paymentId]);

  async function completeSuccess(id: string) {
    try {
      const row = await updatePaymentStatus(id, "succeeded");
      saveOnboarding({
        paymentStatus: "succeeded",
        paymentRef: row.reference,
        paymentId: row.id,
        step: "success",
      });
      void navigate({ to: "/join/success" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment update failed");
    }
  }

  async function startPay(e?: FormEvent) {
    e?.preventDefault();
    setFailReason(null);
    setBusy(true);
    try {
      if (method === "mpesa" && mpesaPhone.replace(/\D/g, "").length < 9) {
        throw new Error("Enter a valid M-Pesa phone number.");
      }
      if (method === "card") {
        if (cardNumber.replace(/\s/g, "").length < 12)
          throw new Error("Enter a valid card number.");
        if (expiry.length < 4) throw new Error("Enter card expiry.");
        if (cvc.length < 3) throw new Error("Enter CVC.");
      }

      const intent = await createPaymentIntent({
        tier,
        amountKsh: t.priceKsh,
        method,
        ...(method === "mpesa" ? { phone: mpesaPhone } : {}),
        metadata: { fullName: onboarding.fullName, email: onboarding.email },
      });

      saveOnboarding({
        paymentMethod: method,
        mpesaPhone,
        paymentId: intent.id,
        paymentRef: intent.reference,
        paymentStatus: "pending",
      });
      setPaymentId(intent.id);
      await updatePaymentStatus(intent.id, "processing");

      if (method === "mpesa") {
        setPhase("pending");
        setWaitLeft(48);
      } else {
        // Mock card 3DS then success
        await new Promise((r) => setTimeout(r, 1200));
        await completeSuccess(intent.id);
      }
    } catch (err) {
      setPhase("failed");
      setFailReason(err instanceof Error ? err.message : "Payment failed");
      if (paymentId) {
        try {
          await updatePaymentStatus(paymentId, "failed", failReason ?? "Payment failed");
        } catch {
          /* ignore */
        }
      }
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  }

  async function cancelPending() {
    if (paymentId) {
      try {
        await updatePaymentStatus(paymentId, "cancelled");
      } catch {
        /* ignore */
      }
    }
    saveOnboarding({ paymentStatus: "idle" });
    setPhase("form");
  }

  async function markApproved() {
    if (!paymentId) return;
    setBusy(true);
    await completeSuccess(paymentId);
    setBusy(false);
  }

  function simulateFail() {
    setPhase("failed");
    setFailReason("M-Pesa timed out. Try again or pay by card.");
    if (paymentId) void updatePaymentStatus(paymentId, "failed", "STK timeout");
  }

  const summary = (
    <OrderSummaryCard
      tierName={t.name}
      priceLabel={ksh(t.priceKsh)}
      coins={num(t.monthlyCoins)}
      renewal={formatRenewal(renews)}
      note={`Cancel any time before ${formatRenewal(renews).replace(/ \d{4}$/, "")}. Up to 10% of unused coins roll over for one month.`}
    />
  );

  if (phase === "pending") {
    return (
      <OnboardingShell step="payment" hideSaveExit>
        <div className="flex w-full flex-1 flex-col gap-10 px-5 py-8 lg:flex-row lg:justify-center lg:gap-16 lg:px-16 lg:py-12">
          <div className="flex w-full max-w-[592px] flex-col gap-5">
            <div className="flex size-[72px] items-center justify-center rounded-full border-2 border-burgundy border-t-transparent animate-spin" />
            <div className="flex flex-col gap-2.5">
              <h1 className="type-h1 text-foreground">Check your phone</h1>
              <p className="type-body-m text-muted-foreground lg:type-body-l">
                We sent a payment request to {displayPhone(mpesaPhone)}. Enter your M-Pesa PIN to
                pay {ksh(t.priceKsh)}.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-info-bg px-3.5 py-2">
              <span className="size-2 animate-pulse rounded-full bg-info" />
              <span className="type-body-s text-foreground">
                Waiting for your approval · 0:{String(waitLeft).padStart(2, "0")}
              </span>
            </div>
            <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5">
              {[
                "Unlock your phone and open the prompt",
                "Enter your M-Pesa PIN",
                "We confirm here automatically",
              ].map((label, i) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-muted type-caption font-bold">
                    {i + 1}
                  </span>
                  <span className="type-body-m text-foreground">{label}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={cancelPending}
                className={buttonClass({ variant: "secondary" })}
              >
                Cancel payment
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={markApproved}
                className={buttonClass({ variant: "emphasis" })}
              >
                I approved on my phone
              </button>
              <button
                type="button"
                onClick={simulateFail}
                className={buttonClass({ variant: "ghost", size: "s" })}
              >
                Simulate failure
              </button>
            </div>
          </div>
          <div className="hidden lg:block">{summary}</div>
        </div>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell step="payment">
      <div className="flex w-full flex-1 flex-col gap-10 px-5 py-8 lg:flex-row lg:justify-center lg:gap-16 lg:px-16 lg:py-12">
        <form onSubmit={startPay} className="flex w-full max-w-[592px] flex-col gap-6">
          <div className="flex flex-col gap-2.5">
            <h1 className="type-h1 text-foreground">Payment</h1>
            <p className="type-body-m text-muted-foreground lg:type-body-l">
              Pay for your first month. Your plan renews monthly on the same date.
            </p>
          </div>

          {phase === "failed" && failReason ? (
            <div className="flex items-start gap-3 rounded-md bg-destructive-bg px-3.5 py-3.5">
              <Icon name="x" size={20} />
              <div>
                <p className="type-body-s-semibold text-foreground">Payment didn’t go through</p>
                <p className="type-body-s text-foreground">{failReason}</p>
              </div>
            </div>
          ) : null}

          <MethodCard
            selected={method === "mpesa"}
            onSelect={() => setMethod("mpesa")}
            title="M-Pesa"
            body="Approve on your phone with your M-Pesa PIN"
          />
          <MethodCard
            selected={method === "card"}
            onSelect={() => setMethod("card")}
            title="Card"
            body="Visa or Mastercard, debit or credit"
          />

          {method === "mpesa" ? (
            <>
              <Field label="M-Pesa phone number">
                <TextInput
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  inputMode="tel"
                />
              </Field>
              <div className="flex items-start gap-3 rounded-md bg-info-bg px-3.5 py-3.5">
                <Icon name="phone" size={20} />
                <p className="type-body-s text-foreground">
                  We’ll send a payment request to this number. Keep your phone close.
                </p>
              </div>
            </>
          ) : (
            <>
              <Field label="Name on card">
                <TextInput value={cardName} onChange={(e) => setCardName(e.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Expiry">
                  <TextInput
                    placeholder="MM / YY"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                  />
                </Field>
                <Field label="CVC">
                  <TextInput
                    placeholder="123"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    inputMode="numeric"
                  />
                </Field>
              </div>
              <Field label="Card number">
                <TextInput
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  inputMode="numeric"
                />
              </Field>
              <AuthCheckbox checked={saveCard} onChange={setSaveCard}>
                Save this card for monthly renewal
              </AuthCheckbox>
              <div className="flex items-start gap-3 rounded-md bg-muted px-3.5 py-3.5">
                <Icon name="lock" size={20} />
                <p className="type-body-s text-foreground">
                  Your bank may ask you to confirm with a one-time code.
                </p>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={busy}
            className={buttonClass({ variant: "emphasis", full: true })}
          >
            {busy ? "Starting…" : `Pay ${ksh(t.priceKsh)}`}
          </button>
          <div className="lg:hidden">{summary}</div>
        </form>
        <div className="hidden lg:block">{summary}</div>
      </div>
    </OnboardingShell>
  );
}

function MethodCard({
  selected,
  onSelect,
  title,
  body,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-4 rounded-xl border px-[18px] py-[17px] text-left",
        selected ? "border-burgundy bg-blush-subtle" : "border-border bg-card",
      )}
    >
      <img
        src={selected ? "/images/icons/radio-on.svg" : "/images/icons/radio-off.svg"}
        alt=""
        width={22}
        height={22}
        className="size-[22px] shrink-0"
      />
      <span>
        <span className="block type-body-s-semibold text-foreground">{title}</span>
        <span className="block type-caption text-muted-foreground">{body}</span>
      </span>
    </button>
  );
}
