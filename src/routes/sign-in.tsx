import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AuthHeading, AuthSplit, MobileAuthChrome } from "@/components/site/auth/AuthSplit";
import { Field, OtpInput, Segmented, TextInput } from "@/components/site/auth/auth-fields";
import { buttonClass } from "@/components/site/primitives";
import { sendPhoneOtp, signInWithEmail, verifyPhoneOtp } from "@/lib/auth";
import { displayPhone, saveOnboarding } from "@/lib/onboarding";

export const Route = createFileRoute("/sign-in")({
  validateSearch: (s: Record<string, unknown>): { as?: string } => {
    const as = typeof s["as"] === "string" ? s["as"] : undefined;
    return as ? { as } : {};
  },
  head: () => ({
    meta: [
      { title: "Sign in — Beauty Wallet" },
      {
        name: "description",
        content: "Sign in with your phone and we’ll text you a code.",
      },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [phone, setPhone] = useState("0712 345 678");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendCode(e?: FormEvent) {
    e?.preventDefault();
    setBusy(true);
    const { error } = await sendPhoneOtp(phone);
    setBusy(false);
    if (error) {
      toast.message("Couldn’t send SMS", {
        description: `${error.message}. You can still enter a code to continue in this demo.`,
      });
    } else {
      toast.success("Code sent");
    }
    saveOnboarding({ phone });
    setOtpSent(true);
  }

  async function verify(e?: FormEvent) {
    e?.preventDefault();
    setBusy(true);
    const { error } = await verifyPhoneOtp(phone, code);
    setBusy(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("sms") || msg.includes("provider") || msg.includes("disabled")) {
        toast.message("SMS not configured", { description: "Continuing to your wallet." });
        window.location.href = search.as === "provider" ? "/vendor" : "/app";
        return;
      }
      toast.error(error.message);
      return;
    }
    window.location.href = search.as === "provider" ? "/vendor" : "/app";
  }

  async function emailSignIn(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await signInWithEmail(email, password);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (email.toLowerCase().includes("@beautywallet.co.ke")) {
      void navigate({ to: "/admin/2fa" });
      return;
    }
    window.location.href = search.as === "provider" ? "/vendor" : "/app";
  }

  const phoneForm = !otpSent ? (
    <form onSubmit={mode === "phone" ? sendCode : emailSignIn} className="flex flex-col gap-[22px]">
      <Segmented
        value={mode}
        onChange={(v) => setMode(v as "phone" | "email")}
        options={[
          { value: "phone", label: "Phone" },
          { value: "email", label: "Email" },
        ]}
      />
      {mode === "phone" ? (
        <>
          <Field label="Phone number">
            <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
          </Field>
          <button
            type="submit"
            disabled={busy}
            className={buttonClass({ variant: "emphasis", full: true })}
          >
            {busy ? "Sending…" : "Send code"}
          </button>
          <p className="text-center type-body-s text-muted-foreground">
            Use email instead to sign in with a password.
          </p>
        </>
      ) : (
        <>
          <Field label="Email">
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password">
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </Field>
          <button
            type="submit"
            disabled={busy}
            className={buttonClass({ variant: "emphasis", full: true })}
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <Link to="/forgot" className="text-center type-body-s-semibold text-burgundy">
            Forgot password?
          </Link>
        </>
      )}
    </form>
  ) : (
    <form onSubmit={verify} className="flex flex-col gap-[22px]">
      <AuthHeading
        title="Enter your code"
        body={`We sent a 6-digit code to ${displayPhone(phone)}.`}
      />
      <OtpInput value={code} onChange={setCode} />
      <button
        type="submit"
        disabled={busy}
        className={buttonClass({ variant: "emphasis", full: true })}
      >
        {busy ? "Verifying…" : "Verify"}
      </button>
      <button
        type="button"
        onClick={() => setOtpSent(false)}
        className="type-body-s-semibold text-burgundy"
      >
        Change number
      </button>
    </form>
  );

  return (
    <>
      <div className="hidden lg:block">
        <AuthSplit
          topRight={
            <>
              <span className="type-body-s text-muted-foreground">New here?</span>
              <Link to="/join" className="type-body-s-semibold text-burgundy">
                Create an account
              </Link>
            </>
          }
          panelImage="/images/auth/signin-panel.jpg"
          panelEyebrow="Nairobi first"
          panelQuote="Salons, barbers and spas across Nairobi. One wallet."
        >
          {!otpSent ? (
            <div className="flex flex-col gap-[22px]">
              <AuthHeading
                title="Welcome back"
                body="Sign in with your phone and we’ll text you a code."
              />
              {phoneForm}
            </div>
          ) : (
            phoneForm
          )}
        </AuthSplit>
      </div>

      <MobileAuthChrome
        step={1}
        onBack={() => (otpSent ? setOtpSent(false) : window.history.back())}
        bottom={
          otpSent ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void verify()}
              className={buttonClass({ variant: "emphasis", full: true })}
            >
              {busy ? "Verifying…" : "Verify"}
            </button>
          ) : mode === "phone" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void sendCode()}
              className={buttonClass({ variant: "emphasis", full: true })}
            >
              {busy ? "Sending…" : "Send code"}
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={(e) => void emailSignIn(e as unknown as FormEvent)}
              className={buttonClass({ variant: "emphasis", full: true })}
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          )
        }
      >
        {!otpSent ? (
          <>
            <AuthHeading
              title="Welcome back"
              body="Sign in with your phone and we’ll text you a code."
              mobileBody="Sign in with your phone."
            />
            <Segmented
              value={mode}
              onChange={(v) => setMode(v as "phone" | "email")}
              options={[
                { value: "phone", label: "Phone" },
                { value: "email", label: "Email" },
              ]}
            />
            {mode === "phone" ? (
              <Field label="Phone number">
                <TextInput
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                />
              </Field>
            ) : (
              <>
                <Field label="Email">
                  <TextInput
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
                <Field label="Password">
                  <TextInput
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
              </>
            )}
            <p className="text-center type-body-s">
              <span className="text-muted-foreground">New here? </span>
              <Link to="/join" className="type-body-s-semibold text-burgundy">
                Create an account
              </Link>
            </p>
          </>
        ) : (
          <>
            <AuthHeading title="Enter your code" body={`Code sent to ${displayPhone(phone)}.`} />
            <OtpInput value={code} onChange={setCode} />
          </>
        )}
      </MobileAuthChrome>
    </>
  );
}
