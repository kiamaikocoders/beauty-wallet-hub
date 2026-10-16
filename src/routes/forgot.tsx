import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AuthHeading, AuthSplit, MobileAuthChrome } from "@/components/site/auth/AuthSplit";
import { Field, TextInput } from "@/components/site/auth/auth-fields";
import { Icon, buttonClass } from "@/components/site/primitives";
import { sendPasswordReset } from "@/lib/auth";

export const Route = createFileRoute("/forgot")({
  head: () => ({
    meta: [
      { title: "Reset your password — Beauty Wallet" },
      {
        name: "description",
        content: "Enter the email on your account and we’ll send you a reset link.",
      },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Enter a valid email.");
      return;
    }
    setBusy(true);
    const { error } = await sendPasswordReset(email);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Reset link sent");
  }

  const body = (
    <form onSubmit={onSubmit} className="flex flex-col gap-[22px]">
      <div className="flex size-16 items-center justify-center rounded-[32px] bg-blush">
        <Icon name="lock" size={28} />
      </div>
      <AuthHeading
        title="Reset your password"
        body="Enter the email on your account and we’ll send you a reset link."
      />
      {sent ? (
        <p className="type-body-m text-foreground">
          Check {email} for a reset link. It expires in one hour.
        </p>
      ) : (
        <Field label="Email">
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
      )}
      <button
        type="submit"
        disabled={busy || sent}
        className={buttonClass({ variant: "emphasis", full: true })}
      >
        {busy ? "Sending…" : sent ? "Link sent" : "Send reset link"}
      </button>
      <p className="type-body-s text-muted-foreground">
        Signed up with your phone only?{" "}
        <Link to="/sign-in" className="type-body-s-semibold text-burgundy">
          Sign in with a code instead
        </Link>
        .
      </p>
    </form>
  );

  return (
    <>
      <div className="hidden lg:block">
        <AuthSplit
          topRight={
            <Link to="/sign-in" className="type-body-s-semibold text-burgundy">
              Back to sign in
            </Link>
          }
          panelImage="/images/auth/signin-panel.jpg"
          panelEyebrow="Nairobi first"
          panelQuote="Salons, barbers and spas across Nairobi. One wallet."
        >
          {body}
        </AuthSplit>
      </div>
      <MobileAuthChrome
        step={1}
        onBack={() => window.history.back()}
        bottom={
          <button
            type="button"
            disabled={busy || sent}
            onClick={(e) => void onSubmit(e as unknown as FormEvent)}
            className={buttonClass({ variant: "emphasis", full: true })}
          >
            {busy ? "Sending…" : sent ? "Link sent" : "Send reset link"}
          </button>
        }
      >
        <div className="flex size-16 items-center justify-center rounded-[32px] bg-blush">
          <Icon name="lock" size={28} />
        </div>
        <AuthHeading
          title="Reset your password"
          body="Enter the email on your account and we’ll send you a reset link."
        />
        {!sent ? (
          <Field label="Email">
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
        ) : (
          <p className="type-body-m text-foreground">Check {email} for a reset link.</p>
        )}
      </MobileAuthChrome>
    </>
  );
}
