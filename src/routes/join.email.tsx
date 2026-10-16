import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthHeading, AuthSplit, MobileAuthChrome } from "@/components/site/auth/AuthSplit";
import { Icon, buttonClass } from "@/components/site/primitives";
import { upsertProfileMetadata } from "@/lib/auth";
import { loadOnboarding, saveOnboarding } from "@/lib/onboarding";

export const Route = createFileRoute("/join/email")({
  head: () => ({
    meta: [
      { title: "Email confirmed — Beauty Wallet" },
      { name: "description", content: "Your email code is confirmed. Continue to pick a plan." },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const navigate = useNavigate();
  const onboarding = loadOnboarding();
  const email = onboarding.email || "your email";
  const confirmed = onboarding.emailVerified;

  function continueOnboarding() {
    saveOnboarding({ step: "plan" });
    void upsertProfileMetadata({ onboarding_step: "plan", email });
    void navigate({ to: "/join/plan" });
  }

  const body = (
    <div className="flex flex-col gap-[22px]">
      <div className="flex size-16 items-center justify-center rounded-[32px] bg-blush">
        <Icon name="mail" size={28} />
      </div>
      <AuthHeading
        eyebrow="Step 1 of 4 · Account"
        title={confirmed ? "Email confirmed" : "Confirm your email"}
        body={
          confirmed
            ? `${email} is confirmed. Text codes will replace this once SMS is live.`
            : "Enter the code we emailed you before choosing a plan."
        }
      />
      {confirmed ? (
        <button
          type="button"
          onClick={continueOnboarding}
          className={buttonClass({ variant: "emphasis", full: true })}
        >
          Continue
        </button>
      ) : (
        <Link to="/join/verify" className={buttonClass({ variant: "emphasis", full: true })}>
          Enter code
        </Link>
      )}
    </div>
  );

  return (
    <>
      <div className="hidden lg:block">
        <AuthSplit
          topRight={
            confirmed ? null : (
              <Link to="/join" className="type-body-s-semibold text-burgundy">
                Change email
              </Link>
            )
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
          confirmed ? (
            <button
              type="button"
              onClick={continueOnboarding}
              className={buttonClass({ variant: "emphasis", full: true })}
            >
              Continue
            </button>
          ) : (
            <Link to="/join/verify" className={buttonClass({ variant: "emphasis", full: true })}>
              Enter code
            </Link>
          )
        }
      >
        <div className="flex size-16 items-center justify-center rounded-[32px] bg-blush">
          <Icon name="mail" size={28} />
        </div>
        <AuthHeading
          title={confirmed ? "Email confirmed" : "Confirm your email"}
          body={
            confirmed
              ? `${email} is confirmed.`
              : "Enter the code we emailed you before choosing a plan."
          }
        />
      </MobileAuthChrome>
    </>
  );
}
