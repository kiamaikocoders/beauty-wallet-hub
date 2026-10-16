import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AuthHeading, AuthSplit, MobileAuthChrome } from "@/components/site/auth/AuthSplit";
import { AuthCheckbox, Field, TextInput } from "@/components/site/auth/auth-fields";
import { buttonClass } from "@/components/site/primitives";
import { sendPhoneOtp } from "@/lib/auth";
import { loadOnboarding, saveOnboarding } from "@/lib/onboarding";

export const Route = createFileRoute("/join/")({
  validateSearch: (s: Record<string, unknown>): { plan?: string } => {
    const plan = typeof s["plan"] === "string" ? s["plan"] : undefined;
    return plan ? { plan } : {};
  },
  head: () => ({
    meta: [
      { title: "Create your account — Beauty Wallet" },
      {
        name: "description",
        content: "It takes about two minutes. We text a code to confirm your phone.",
      },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const existing = loadOnboarding();
  const [fullName, setFullName] = useState(existing.fullName || "Amani Wanjiru");
  const [phone, setPhone] = useState(existing.phone || "0712 345 678");
  const [email, setEmail] = useState(existing.email || "amani@example.com");
  const [agreed, setAgreed] = useState(true);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!agreed) {
      toast.error("Please agree to the Terms of service and Coin policy.");
      return;
    }
    if (fullName.trim().length < 2) {
      toast.error("Enter your full name.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 9) {
      toast.error("Enter a valid phone number.");
      return;
    }
    if (!email.includes("@")) {
      toast.error("Enter a valid email.");
      return;
    }

    setBusy(true);
    const tier =
      search.plan === "basic" || search.plan === "premium" || search.plan === "intermediate"
        ? search.plan
        : existing.tier;

    saveOnboarding({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      mpesaPhone: phone.trim(),
      tier: tier ?? "intermediate",
      step: "verify",
    });

    const { error } = await sendPhoneOtp(phone);
    setBusy(false);
    if (error) {
      toast.message("We couldn’t send an SMS yet", {
        description: `${error.message}. You can still continue — enter any 6-digit code to keep going in this demo.`,
      });
    }
    void navigate({ to: "/join/verify" });
  }

  const formFields = (
    <>
      <Field label="Full name">
        <TextInput
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
        />
      </Field>
      <Field label="Phone number">
        <TextInput
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          autoComplete="tel"
        />
      </Field>
      <Field label="Email">
        <TextInput
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </Field>
      <AuthCheckbox checked={agreed} onChange={setAgreed}>
        I agree to the{" "}
        <Link to="/legal/$doc" params={{ doc: "terms" }} className="text-burgundy">
          Terms of service
        </Link>{" "}
        and{" "}
        <Link to="/legal/$doc" params={{ doc: "coin-policy" }} className="text-burgundy">
          Coin policy
        </Link>
      </AuthCheckbox>
    </>
  );

  return (
    <>
      <div className="hidden lg:block">
        <AuthSplit
          topRight={
            <>
              <span className="type-body-s text-muted-foreground">Already a member?</span>
              <Link to="/sign-in" className="type-body-s-semibold text-burgundy">
                Sign in
              </Link>
            </>
          }
          panelImage="/images/auth/signup-panel.jpg"
          panelEyebrow="Member story"
          panelQuote="“I book braids and a facial in one go and walk out without touching my wallet.”"
          panelAttribution="Amani W. · Intermediate member, Kilimani"
        >
          <form onSubmit={onSubmit} className="flex flex-col gap-[22px]">
            <AuthHeading
              eyebrow="Step 1 of 4 · Account"
              title="Create your account"
              body="It takes about two minutes. We text a code to confirm your phone."
            />
            {formFields}
            <button
              type="submit"
              disabled={busy}
              className={buttonClass({ variant: "emphasis", full: true })}
            >
              {busy ? "Sending…" : "Continue"}
            </button>
          </form>
        </AuthSplit>
      </div>

      <MobileAuthChrome
        step={1}
        onBack={() => window.history.back()}
        bottom={
          <>
            <button
              type="button"
              disabled={busy}
              onClick={(e) => onSubmit(e as unknown as FormEvent)}
              className={buttonClass({ variant: "emphasis", full: true })}
            >
              {busy ? "Sending…" : "Continue"}
            </button>
            <p className="text-center type-body-s">
              <span className="text-muted-foreground">Already a member? </span>
              <Link to="/sign-in" className="type-body-s-semibold text-burgundy">
                Sign in
              </Link>
            </p>
          </>
        }
      >
        <AuthHeading
          title="Create your account"
          body="It takes about two minutes. We text a code to confirm your phone."
          mobileBody="It takes about two minutes."
        />
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          {formFields}
        </form>
      </MobileAuthChrome>
    </>
  );
}
