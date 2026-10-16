import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AuthHeading, AuthSplit, MobileAuthChrome } from "@/components/site/auth/AuthSplit";
import { Icon, buttonClass } from "@/components/site/primitives";
import { sendEmailVerification, upsertProfileMetadata } from "@/lib/auth";
import { firstName, loadOnboarding, saveOnboarding } from "@/lib/onboarding";
import { notifyEmail } from "@/lib/resend";

export const Route = createFileRoute("/join/email")({
  head: () => ({
    meta: [
      { title: "Check your inbox — Beauty Wallet" },
      { name: "description", content: "We sent a verification link to your email." },
    ],
  }),
  component: VerifyEmailPage,
});

function sendVerifyMail(email: string, fullName: string) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  notifyEmail({
    to: email,
    template: "verify",
    data: {
      firstName: firstName(fullName),
      email,
      code,
      ctaUrl: `${window.location.origin}/join/email`,
    },
  });
}

function VerifyEmailPage() {
  const navigate = useNavigate();
  const onboarding = loadOnboarding();
  const email = onboarding.email || "amani@example.com";
  const [busy, setBusy] = useState(false);
  const mailed = useRef(false);

  useEffect(() => {
    if (mailed.current || !email.includes("@")) return;
    mailed.current = true;
    sendVerifyMail(email, onboarding.fullName);
    void sendEmailVerification(email);
  }, [email, onboarding.fullName]);

  function continueOnboarding() {
    saveOnboarding({ step: "plan" });
    void upsertProfileMetadata({ onboarding_step: "plan", email });
    void navigate({ to: "/join/plan" });
  }

  async function resend() {
    setBusy(true);
    sendVerifyMail(email, onboarding.fullName);
    const { error } = await sendEmailVerification(email);
    setBusy(false);
    if (error) {
      toast.message("Couldn’t resend Supabase mail", { description: error.message });
    }
    toast.success("Verification email sent");
  }

  const body = (
    <div className="flex flex-col gap-[22px]">
      <div className="flex size-16 items-center justify-center rounded-[32px] bg-blush">
        <Icon name="mail" size={28} />
      </div>
      <AuthHeading
        eyebrow="Step 1 of 4 · Account"
        title="Check your inbox"
        body={`We sent a verification link to ${email}. It expires in 24 hours.`}
      />
      <a href="mailto:" className={buttonClass({ variant: "emphasis", full: true })}>
        Open email app
      </a>
      <button
        type="button"
        disabled={busy}
        onClick={resend}
        className={buttonClass({ variant: "secondary", full: true })}
      >
        {busy ? "Sending…" : "Resend link"}
      </button>
      <p className="type-body-s text-muted-foreground">
        You can keep going and verify later. We only need it for receipts.
      </p>
      <button
        type="button"
        onClick={continueOnboarding}
        className={buttonClass({ variant: "ghost", full: true })}
      >
        Continue without verifying
      </button>
    </div>
  );

  return (
    <>
      <div className="hidden lg:block">
        <AuthSplit
          topRight={
            <button
              type="button"
              onClick={continueOnboarding}
              className="type-body-s-semibold text-burgundy"
            >
              Skip for now
            </button>
          }
          panelImage="/images/auth/email-panel.jpg"
          panelEyebrow="Why members stay"
          panelQuote="Every service shows its Ksh value, so you always know what you save."
        >
          {body}
        </AuthSplit>
      </div>

      <MobileAuthChrome
        step={1}
        onBack={() => void navigate({ to: "/join/verify" })}
        bottom={
          <>
            <a href="mailto:" className={buttonClass({ variant: "emphasis", full: true })}>
              Open email app
            </a>
            <button
              type="button"
              onClick={continueOnboarding}
              className="text-center type-body-s-semibold text-burgundy"
            >
              Skip for now
            </button>
          </>
        }
      >
        <div className="flex size-16 items-center justify-center rounded-[32px] bg-blush">
          <Icon name="mail" size={28} />
        </div>
        <AuthHeading
          title="Check your inbox"
          body={`We sent a verification link to ${email}. It expires in 24 hours.`}
        />
        <button
          type="button"
          disabled={busy}
          onClick={resend}
          className={buttonClass({ variant: "secondary", full: true })}
        >
          {busy ? "Sending…" : "Resend link"}
        </button>
        <p className="type-body-s text-muted-foreground">
          You can keep going and verify later. We only need it for receipts.
        </p>
      </MobileAuthChrome>
    </>
  );
}
