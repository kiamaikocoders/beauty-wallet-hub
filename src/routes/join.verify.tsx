import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AuthHeading, AuthSplit, MobileAuthChrome } from "@/components/site/auth/AuthSplit";
import { OtpInput, useResendTimer } from "@/components/site/auth/auth-fields";
import { Icon, buttonClass } from "@/components/site/primitives";
import { signUpWithEmail, upsertProfileMetadata } from "@/lib/auth";
import { firstName, loadOnboarding, saveOnboarding } from "@/lib/onboarding";
import { sendEmailCode, verifyEmailCode } from "@/lib/resend";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/join/verify")({
  head: () => ({
    meta: [
      { title: "Verify your email — Beauty Wallet" },
      { name: "description", content: "Enter the 6-digit code we emailed you." },
    ],
  }),
  component: VerifyPhonePage,
});

function VerifyPhonePage() {
  const navigate = useNavigate();
  const onboarding = loadOnboarding();
  const email = onboarding.email;
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [triesLeft, setTriesLeft] = useState(3);
  const [ticket, setTicket] = useState({
    token: onboarding.emailCodeToken,
    exp: onboarding.emailCodeExp,
  });
  const [otpError, setOtpError] = useState<"wrong" | "expired" | null>(
    ticket.exp > 0 && Date.now() > ticket.exp ? "expired" : null,
  );
  const timer = useResendTimer(42);

  async function onVerify(e?: FormEvent) {
    e?.preventDefault();
    if (!email.includes("@") || !ticket.token) {
      toast.error("Start again so we can email you a code.");
      void navigate({ to: "/join" });
      return;
    }
    if (otpError === "expired" || Date.now() > ticket.exp) {
      setOtpError("expired");
      await onResend();
      return;
    }
    if (code.length < 6) {
      toast.error("Enter the 6-digit code.");
      return;
    }

    setBusy(true);
    const result = await verifyEmailCode({
      data: {
        email,
        code,
        token: ticket.token,
        exp: ticket.exp,
      },
    });
    setBusy(false);

    if (!result.ok) {
      if (result.error === "expired") {
        setOtpError("expired");
        return;
      }
      const next = triesLeft - 1;
      setTriesLeft(next);
      setOtpError("wrong");
      if (next <= 0) toast.error("Too many attempts. Send a new code.");
      return;
    }

    if (onboarding.password.length < 8) {
      toast.error("Go back and choose a password before continuing.");
      void navigate({ to: "/join" });
      return;
    }
    const signedUp = await signUpWithEmail(
      email,
      onboarding.password,
      onboarding.fullName,
      onboarding.phone,
      onboarding.gender,
    );
    if (signedUp.error) {
      const msg = signedUp.error.message.toLowerCase();
      if (msg.includes("already")) {
        toast.error("That email already has an account. Sign in with your password.");
      } else if (msg.includes("confirm")) {
        toast.message("Confirm your email", {
          description: "Open the confirmation link, then sign in with this password.",
        });
      } else {
        toast.error(signedUp.error.message);
      }
      return;
    }
    saveOnboarding({ emailVerified: true, password: "", step: "email" });
    await upsertProfileMetadata({
      full_name: onboarding.fullName,
      phone: onboarding.phone,
      email,
      gender: onboarding.gender,
      onboarding_step: "email",
    });
    void navigate({ to: "/join/email" });
  }

  async function onResend() {
    if (!email.includes("@")) return;
    if (!timer.ready && otpError !== "expired") return;
    setBusy(true);
    const sent = await sendEmailCode({
      data: { email, firstName: firstName(onboarding.fullName) },
    });
    setBusy(false);
    if (!sent.ok || !sent.token || !sent.exp) {
      toast.error(sent.error ?? "Couldn’t email a new code");
      return;
    }
    saveOnboarding({ emailCodeToken: sent.token, emailCodeExp: sent.exp });
    setTicket({ token: sent.token, exp: sent.exp });
    setOtpError(null);
    setTriesLeft(3);
    setCode("");
    timer.restart();
    toast.success(`New code sent to ${email}`);
  }

  const errorBanner =
    otpError === "wrong" ? (
      <div className="flex items-start gap-3 rounded-md bg-destructive-bg px-3.5 py-3.5">
        <Icon name="x" size={20} />
        <p className="type-body-s text-foreground">
          That code didn’t match. You have {Math.max(triesLeft, 0)} tries left.
        </p>
      </div>
    ) : otpError === "expired" ? (
      <div className="flex items-start gap-3 rounded-md bg-warning-bg px-3.5 py-3.5">
        <Icon name="refresh" size={20} />
        <p className="type-body-s text-foreground">
          This code expired after 10 minutes. Send a new one to continue.
        </p>
      </div>
    ) : null;

  const form = (
    <form onSubmit={onVerify} className="flex flex-col gap-[22px]">
      <OtpInput value={code} onChange={setCode} error={otpError === "wrong"} />
      {errorBanner}
      {otpError !== "expired" && otpError !== "wrong" ? (
        <p className="type-body-s text-muted-foreground">
          Didn’t get it?{" "}
          <button
            type="button"
            onClick={onResend}
            className={cn(
              "type-body-s-semibold",
              timer.ready ? "text-burgundy" : "text-muted-foreground",
            )}
          >
            {timer.label}
          </button>
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className={buttonClass({ variant: "emphasis", full: true })}
      >
        {otpError === "expired" ? "Send new code" : busy ? "Verifying…" : "Verify"}
      </button>
    </form>
  );

  return (
    <>
      <div className="hidden lg:block">
        <AuthSplit
          topRight={
            <Link to="/join" className="type-body-s-semibold text-burgundy">
              Change email
            </Link>
          }
          panelImage="/images/auth/verify-panel.jpg"
          panelEyebrow="Why members stay"
          panelQuote="Your coins are held, not spent, until you show your arrival PIN."
        >
          <div className="flex flex-col gap-[22px]">
            <AuthHeading
              eyebrow="Step 1 of 4 · Account"
              title="Check your email"
              body={`Enter the 6-digit code we sent to ${email || "your email"}. Text messages aren’t live yet.`}
            />
            {form}
          </div>
        </AuthSplit>
      </div>

      <MobileAuthChrome
        step={1}
        onBack={() => void navigate({ to: "/join" })}
        bottom={
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (otpError === "expired") void onResend();
                else void onVerify();
              }}
              className={buttonClass({ variant: "emphasis", full: true })}
            >
              {otpError === "expired" ? "Send new code" : busy ? "Verifying…" : "Verify"}
            </button>
            {otpError === "expired" ? (
              <Link to="/join" className="text-center type-body-s-semibold text-burgundy">
                Change email
              </Link>
            ) : (
              <button
                type="button"
                onClick={onResend}
                className="text-center type-body-s-semibold text-burgundy"
              >
                Resend code
              </button>
            )}
          </>
        }
      >
        <AuthHeading
          title="Check your email"
          body={`Enter the 6-digit code we sent to ${email || "your email"}.`}
          mobileBody={`Code sent to ${email || "your email"}.`}
        />
        <OtpInput value={code} onChange={setCode} error={otpError === "wrong"} />
        {errorBanner}
      </MobileAuthChrome>
    </>
  );
}
