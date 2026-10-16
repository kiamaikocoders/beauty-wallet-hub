import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Logo, buttonClass } from "@/components/site/primitives";
import { supabase } from "@/integrations/supabase/client";
import { setTeamsHrSession } from "@/lib/teams-demo";
import { ksh, type TierId } from "@/lib/pricing";
import { cn } from "@/lib/utils";

type Step = "company" | "seats" | "pay" | "ready";

const TIER_META: Record<TierId, { coins: number; price: number }> = {
  basic: { coins: 700, price: 7000 },
  intermediate: { coins: 1500, price: 15000 },
  premium: { coins: 2000, price: 20000 },
};

export function TeamsSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("company");
  const [company, setCompany] = useState("Savannah Logistics Ltd");
  const [hrName, setHrName] = useState("Lucy Njambi");
  const [phone, setPhone] = useState("0722 456 789");
  const [email, setEmail] = useState("hr@savannahlogistics.co.ke");
  const [agreed, setAgreed] = useState(true);
  const [seats, setSeats] = useState({ basic: 6, intermediate: 8, premium: 2 });
  const [payMethod, setPayMethod] = useState<"mpesa" | "card">("mpesa");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const totalSeats = seats.basic + seats.intermediate + seats.premium;
  const totalKsh =
    seats.basic * TIER_META.basic.price +
    seats.intermediate * TIER_META.intermediate.price +
    seats.premium * TIER_META.premium.price;

  async function onCompany(e: FormEvent) {
    e.preventDefault();
    if (!agreed) return;
    setBusy(true);
    setError("");
    try {
      const { error: rpcError } = await supabase.rpc(
        "teams_signup_company" as never,
        {
          p_company_name: company,
          p_hr_name: hrName,
          p_phone: phone,
          p_work_email: email,
        } as never,
      );
      if (rpcError) throw rpcError;
      setStep("seats");
    } catch {
      // Demo path: continue even if RPC fails (e.g. duplicate)
      setStep("seats");
    } finally {
      setBusy(false);
    }
  }

  function bump(tier: TierId, delta: number) {
    setSeats((s) => ({ ...s, [tier]: Math.max(0, s[tier] + delta) }));
  }

  return (
    <div className="min-h-dvh w-full bg-background">
      {step === "company" && (
        <div className="flex min-h-dvh w-full flex-col lg:flex-row">
          <div className="flex w-full flex-col px-5 pb-8 pt-10 lg:w-1/2 lg:px-16 lg:pb-8 lg:pt-10">
            <div className="flex items-center justify-between">
              <Logo />
              <p className="type-body-s text-muted-foreground">
                Already set up?{" "}
                <button
                  type="button"
                  className="type-body-s-semibold text-burgundy"
                  onClick={() => {
                    setTeamsHrSession(true);
                    void navigate({ to: "/teams", search: { hr: "1" } });
                  }}
                >
                  Sign in
                </button>
              </p>
            </div>
            <form
              onSubmit={onCompany}
              className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center gap-[22px] py-10"
            >
              <p className="type-eyebrow">Step 1 of 4 · Company</p>
              <div>
                <h1 className="type-h1">Set up your team</h1>
                <p className="type-body-l mt-2.5 text-muted-foreground">
                  For companies paying for staff. Takes about three minutes. We text a code to
                  confirm your phone.
                </p>
              </div>
              {(
                [
                  ["Company name", company, setCompany],
                  ["Your name", hrName, setHrName],
                  ["Your phone number", phone, setPhone],
                  ["Work email", email, setEmail],
                ] as const
              ).map(([label, value, set]) => (
                <label key={label} className="flex flex-col gap-2">
                  <span className="type-body-s-medium">{label}</span>
                  <input
                    required
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    type={label.includes("email") ? "email" : "text"}
                    className="min-h-[52px] rounded-md border border-border bg-card px-4 type-body-m outline-none focus:border-foreground"
                  />
                </label>
              ))}
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="size-[22px] accent-burgundy"
                />
                <span className="type-body-s">I agree to the Business terms and Coin policy</span>
              </label>
              {error && <p className="type-body-s text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={busy || !agreed}
                className={buttonClass({ variant: "emphasis", full: true })}
              >
                Continue
              </button>
            </form>
            <p className="type-caption text-muted-foreground">
              © 2026 Beauty Wallet Ltd ·{" "}
              <Link
                to="/legal/$doc"
                params={{ doc: "privacy" }}
                className="underline-offset-2 hover:underline"
              >
                Privacy
              </Link>{" "}
              ·{" "}
              <Link
                to="/legal/$doc"
                params={{ doc: "terms" }}
                className="underline-offset-2 hover:underline"
              >
                Terms
              </Link>
            </p>
          </div>
          <div className="hidden p-4 lg:flex lg:w-1/2">
            <div className="relative flex flex-1 flex-col justify-end overflow-hidden rounded-[28px] p-8">
              <img
                src="/images/teams/signup-panel.jpg"
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
              <div className="relative rounded-[20px] bg-primary p-7 text-primary-foreground">
                <p className="type-eyebrow text-gold">Why teams use it</p>
                <p className="type-h3 mt-3">
                  “It’s the one perk people actually talk about at lunch.”
                </p>
                <p className="type-body-s-medium mt-3 opacity-70">
                  Lucy N. · HR manager, Savannah Logistics
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === "seats" && (
        <SignupChrome
          stepLabel="Seats"
          onExit={() => navigate({ to: "/teams", search: {} as never })}
        >
          <div className="mx-auto grid w-full max-w-5xl gap-8 px-5 py-10 lg:grid-cols-[1fr_360px] lg:px-16">
            <div>
              <h1 className="type-h1">Seats</h1>
              <p className="type-body-l mt-2 text-muted-foreground">
                Choose how many people get each tier.
              </p>
              <div className="mt-8 flex flex-col gap-4">
                {(Object.keys(TIER_META) as TierId[]).map((tier) => (
                  <div
                    key={tier}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-5"
                  >
                    <div>
                      <p className="type-h4 capitalize">{tier}</p>
                      <p className="type-body-s text-muted-foreground">
                        {TIER_META[tier].coins.toLocaleString("en-KE")} coins ·{" "}
                        {ksh(TIER_META[tier].price)} a seat
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="size-11 rounded-full border border-border"
                        onClick={() => bump(tier, -1)}
                      >
                        −
                      </button>
                      <span className="type-h3 w-8 text-center">{seats[tier]}</span>
                      <button
                        type="button"
                        className="size-11 rounded-full border border-border"
                        onClick={() => bump(tier, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="type-body-s mt-4 text-muted-foreground">
                Add, remove or move seats any time. Changes start on the 1st.
              </p>
              <button
                type="button"
                className={cn(buttonClass({ variant: "emphasis" }), "mt-6")}
                onClick={() => setStep("pay")}
              >
                Continue to payment
              </button>
            </div>
            <PlanCard
              seats={totalSeats}
              lines={[
                {
                  label: `Basic · ${seats.basic} seats`,
                  value: ksh(seats.basic * TIER_META.basic.price),
                },
                {
                  label: `Intermediate · ${seats.intermediate} seats`,
                  value: ksh(seats.intermediate * TIER_META.intermediate.price),
                },
                {
                  label: `Premium · ${seats.premium} seats`,
                  value: ksh(seats.premium * TIER_META.premium.price),
                },
              ]}
              total={ksh(totalKsh)}
              footer="Invoiced on the 1st of each month. Pay by M-Pesa or card."
            />
          </div>
        </SignupChrome>
      )}

      {step === "pay" && (
        <SignupChrome
          stepLabel="Payment"
          onExit={() => navigate({ to: "/teams", search: {} as never })}
        >
          <div className="mx-auto grid w-full max-w-5xl gap-8 px-5 py-10 lg:grid-cols-[1fr_360px] lg:px-16">
            <div>
              <h1 className="type-h1">Payment</h1>
              <p className="type-body-l mt-2 text-muted-foreground">
                Pay your first month. After that, invoices come on the 1st.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                {(
                  [
                    ["mpesa", "M-Pesa", "Approve on your phone with your M-Pesa PIN"],
                    ["card", "Card", "Visa or Mastercard, debit or credit"],
                  ] as const
                ).map(([id, label, help]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPayMethod(id)}
                    className={cn(
                      "rounded-lg border px-5 py-4 text-left",
                      payMethod === id
                        ? "border-burgundy bg-blush-subtle"
                        : "border-border bg-card",
                    )}
                  >
                    <p className="type-body-m-medium">{label}</p>
                    <p className="type-body-s text-muted-foreground">{help}</p>
                  </button>
                ))}
              </div>
              {payMethod === "mpesa" && (
                <label className="mt-6 flex flex-col gap-2">
                  <span className="type-body-s-medium">M-Pesa phone number</span>
                  <input
                    defaultValue="0712 345 678"
                    className="min-h-[52px] rounded-md border border-border bg-card px-4 type-body-m outline-none"
                  />
                  <span className="type-caption text-muted-foreground">
                    We’ll send a payment request to this number. Keep your phone close.
                  </span>
                </label>
              )}
              <button
                type="button"
                className={cn(buttonClass({ variant: "emphasis" }), "mt-6")}
                onClick={() => setStep("ready")}
              >
                Pay {ksh(totalKsh)}
              </button>
            </div>
            <PlanCard
              seats={totalSeats}
              lines={[
                {
                  label: `Basic · ${seats.basic} seats`,
                  value: ksh(seats.basic * TIER_META.basic.price),
                },
                {
                  label: `Intermediate · ${seats.intermediate} seats`,
                  value: ksh(seats.intermediate * TIER_META.intermediate.price),
                },
                {
                  label: `Premium · ${seats.premium} seats`,
                  value: ksh(seats.premium * TIER_META.premium.price),
                },
              ]}
              totalLabel="Due today"
              total={ksh(totalKsh)}
              footer="Next invoice Tue 1 Sep. Change seats any time."
            />
          </div>
        </SignupChrome>
      )}

      {step === "ready" && (
        <SignupChrome
          stepLabel="Ready"
          onExit={() => navigate({ to: "/teams", search: {} as never })}
        >
          <div className="mx-auto grid w-full max-w-5xl gap-8 px-5 py-10 lg:grid-cols-[1fr_360px] lg:px-16">
            <div>
              <p className="type-eyebrow text-success">Payment received</p>
              <h1 className="type-h1 mt-2">Savannah Logistics is set up.</h1>
              <p className="type-body-l mt-3 text-muted-foreground">
                {totalSeats} seats are ready. Invite your staff and their coins arrive when they
                join.
              </p>
              <div className="mt-6 rounded-lg border border-border bg-card p-5">
                <p className="type-body-s">
                  Paid by M-Pesa · <span className="type-body-s-medium">{ksh(totalKsh)}</span>
                </p>
                <p className="type-body-s mt-1">Invoice · INV-SL-0001</p>
                <p className="type-caption mt-2 text-muted-foreground">Receipt sent to {email}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  className={buttonClass({ variant: "emphasis" })}
                  onClick={() => {
                    setTeamsHrSession(true);
                    void navigate({ to: "/teams/staff", search: { invite: "1" } });
                  }}
                >
                  Invite staff
                </button>
                <button type="button" className={buttonClass({ variant: "secondary" })}>
                  Upload a list (CSV)
                </button>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="type-eyebrow">Savannah Logistics</p>
              <p className="type-stat mt-2">
                {totalSeats} <span className="type-body-m text-muted-foreground">seats ready</span>
              </p>
              <ul className="mt-4 flex flex-col gap-3 type-body-s">
                <li>Basic · {seats.basic} seats · 700 coins each</li>
                <li>Intermediate · {seats.intermediate} seats · 1,500 coins each</li>
                <li>Premium · {seats.premium} seats · 2,000 coins each</li>
              </ul>
              <p className="type-caption mt-4 text-muted-foreground">
                0 of {totalSeats} joined · next invoice Tue 1 Sep
              </p>
              <p className="type-caption mt-2 text-muted-foreground">
                Staff get a text to join. You see seats fill up here.
              </p>
              <button
                type="button"
                className={cn(buttonClass({ variant: "primary", full: true }), "mt-6")}
                onClick={() => {
                  setTeamsHrSession(true);
                  void navigate({ to: "/teams", search: {} as never });
                }}
              >
                Go to overview
              </button>
            </div>
          </div>
        </SignupChrome>
      )}
    </div>
  );
}

function SignupChrome({
  children,
  stepLabel,
  onExit,
}: {
  children: React.ReactNode;
  stepLabel: string;
  onExit: () => void;
}) {
  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between border-b border-border px-5 py-4 lg:px-16">
        <Logo />
        <p className="type-body-s text-muted-foreground">{stepLabel}</p>
        <button type="button" onClick={onExit} className="type-body-s-semibold text-burgundy">
          Save and exit
        </button>
      </header>
      {children}
    </div>
  );
}

function PlanCard({
  seats,
  lines,
  total,
  totalLabel = "Monthly total",
  footer,
}: {
  seats: number;
  lines: { label: string; value: string }[];
  total: string;
  totalLabel?: string;
  footer: string;
}) {
  return (
    <aside className="h-fit rounded-lg border border-border bg-card p-5">
      <p className="type-eyebrow">Your team plan</p>
      <p className="type-stat mt-2">
        {seats} <span className="type-body-m text-muted-foreground">seats</span>
      </p>
      <ul className="mt-4 flex flex-col gap-2">
        {lines.map((l) => (
          <li key={l.label} className="flex justify-between type-body-s">
            <span className="text-muted-foreground">{l.label}</span>
            <span>{l.value}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-between border-t border-border pt-4 type-body-m-medium">
        <span>{totalLabel}</span>
        <span>{total}</span>
      </div>
      <p className="type-caption mt-3 text-muted-foreground">{footer}</p>
    </aside>
  );
}
