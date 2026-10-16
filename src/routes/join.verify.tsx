import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AuthHeading, AuthSplit, MobileAuthChrome } from "@/components/site/auth/AuthSplit";
import { OtpInput, useResendTimer } from "@/components/site/auth/auth-fields";
import { Icon, buttonClass } from "@/components/site/primitives";
import { sendPhoneOtp, upsertProfileMetadata, verifyPhoneOtp } from "@/lib/auth";
import { displayPhone, loadOnboarding, saveOnboarding } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/join/verify")({
  head: () => ({
    meta: [
      { title: "Verify your phone — Beauty Wallet" },
      { name: "description", content: "Enter the 6-digit code we sent to your phone." },
    ],
  }),
  component: VerifyPhonePage,
});

function VerifyPhonePage() {
  const navigate = useNavigate();
  const onboarding = loadOnboarding();
  const phone = onboarding.phone || "0712 345 678";
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [triesLeft, setTriesLeft] = useState(3);
  const [otpError, setOtpError] = useState<"wrong" | "expired" | null>(null);
  const timer = useResendTimer(42);

  async function onVerify(e?: FormEvent) {
    e?.preventDefault();
    if (code.length < 6) {
      toast.error("Enter the 6-digit code.");
      return;
    }
    if (otpError === "expired") {
      toast.error("This code expired. Send a new one to continue.");
      return;
    }

    setBusy(true);
    const { error } = await verifyPhoneOtp(phone, code);
    setBusy(false);

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("expired")) {
        setOtpError("expired");
        return;
      }
      const next = triesLeft - 1;
      setTriesLeft(next);
      setOtpError("wrong");
      if (next <= 0) {
        toast.error("Too many attempts. Request a new code.");
      }
      // Demo fallback: allow continuing when SMS provider isn't configured
      if (msg.includes("sms") || msg.includes("provider") || msg.includes("disabled")) {
        saveOnboarding({ phoneVerified: true, step: "email" });
        void navigate({ to: "/join/email" });
      }
      return;
    }

    saveOnboarding({ phoneVerified: true, step: "email" });
    await upsertProfileMetadata({
      full_name: onboarding.fullName,
      phone,
      email: onboarding.email,
      onboarding_step: "email",
    });
    void navigate({ to: "/join/email" });
  }

  async function onResend() {
    if (!timer.ready && otpError !== "expired") return;
    setOtpError(null);
    setTriesLeft(3);
    setCode("");
    timer.restart();
    const { error } = await sendPhoneOtp(phone);
    if (error) {
      toast.message("Couldn’t resend SMS", { description: error.message });
    } else {
      toast.success("Code sent");
    }
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
              Change number
            </Link>
          }
          panelImage="/images/auth/verify-panel.jpg"
          panelEyebrow="Why members stay"
          panelQuote="Your coins are held, not spent, until you show your arrival PIN."
        >
          <div className="flex flex-col gap-[22px]">
            <AuthHeading
              eyebrow="Step 1 of 4 · Account"
              title="Verify your phone"
              body={`Enter the 6-digit code we sent to ${displayPhone(phone)}.`}
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
                Change number
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
          title="Verify your phone"
          body={`Enter the 6-digit code we sent to ${displayPhone(phone)}.`}
          mobileBody={`Enter the code we sent to ${displayPhone(phone)}.`}
        />
        <OtpInput value={code} onChange={setCode} error={otpError === "wrong"} />
        {errorBanner}
      </MobileAuthChrome>
    </>
  );
}
