import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AuthHeading, AuthSplit, MobileAuthChrome } from "@/components/site/auth/AuthSplit";
import { AuthCheckbox, Field, TextInput } from "@/components/site/auth/auth-fields";
import type { Gender } from "@/lib/onboarding";
import { buttonClass } from "@/components/site/primitives";
import { firstName, loadOnboarding, saveOnboarding } from "@/lib/onboarding";
import { sendEmailCode } from "@/lib/resend";

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
        content: "It takes about two minutes. We email a code to confirm your address.",
      },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const existing = loadOnboarding();
  const [fullName, setFullName] = useState(
    existing.fullName === "Amani Wanjiru" ? "" : existing.fullName,
  );
  const [phone, setPhone] = useState(existing.phone === "0712 345 678" ? "" : existing.phone);
  const [email, setEmail] = useState(
    existing.email === "amani@example.com" ? "" : existing.email,
  );
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState<Gender | "">(existing.gender);
  const [agreed, setAgreed] = useState(false);
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
    if (password.length < 8 || !/\d/.test(password)) {
      toast.error("Use a password with at least 8 characters and one number.");
      return;
    }
    if (gender !== "male" && gender !== "female" && gender !== "rather_not_say") {
      toast.error("Choose a gender option.");
      return;
    }

    setBusy(true);
    const tier =
      search.plan === "basic" || search.plan === "premium" || search.plan === "intermediate"
        ? search.plan
        : existing.tier;

    const trimmedEmail = email.trim().toLowerCase();
    saveOnboarding({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: trimmedEmail,
      password,
      gender,
      mpesaPhone: phone.trim(),
      tier: tier ?? "intermediate",
      step: "verify",
      emailVerified: false,
    });

    const sent = await sendEmailCode({
      data: { email: trimmedEmail, firstName: firstName(fullName) },
    });
    setBusy(false);
    if (!sent.ok || !sent.token || !sent.exp) {
      toast.error(sent.error ?? "We couldn’t email your code. Try again.");
      return;
    }
    saveOnboarding({ emailCodeToken: sent.token, emailCodeExp: sent.exp });
    if (sent.skipped) {
      toast.message("Email isn’t configured on this server", {
        description: "Add RESEND_API_KEY so the code can be delivered.",
      });
    } else {
      toast.success(`Code sent to ${trimmedEmail}`);
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
          placeholder="Amani Wanjiru"
        />
      </Field>
      <Field label="Phone number">
        <TextInput
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          autoComplete="tel"
          placeholder="0712 345 678"
        />
      </Field>
      <Field label="Email">
        <TextInput
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="amani@example.com"
        />
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="type-body-s-medium text-foreground">Gender</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {(
            [
              ["male", "Male"],
              ["female", "Female"],
              ["rather_not_say", "Rather not say"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3"
            >
              <input
                type="radio"
                name="gender"
                value={value}
                checked={gender === value}
                onChange={() => setGender(value)}
                className="accent-burgundy"
              />
              <span className="type-body-s">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Password">
        <TextInput
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="At least 8 characters and a number"
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
              body="It takes about two minutes. We email a 6-digit code to confirm your address."
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
          body="It takes about two minutes. We email a 6-digit code to confirm your address."
          mobileBody="It takes about two minutes."
        />
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          {formFields}
        </form>
      </MobileAuthChrome>
    </>
  );
}
