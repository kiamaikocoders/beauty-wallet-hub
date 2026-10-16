import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AuthHeading, AuthSplit, MobileAuthChrome } from "@/components/site/auth/AuthSplit";
import { Field, TextInput } from "@/components/site/auth/auth-fields";
import { Icon, buttonClass } from "@/components/site/primitives";
import { updatePassword } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reset")({
  head: () => ({
    meta: [
      { title: "Choose a new password — Beauty Wallet" },
      {
        name: "description",
        content: "Use at least 8 characters. You’ll be signed out on other devices.",
      },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const rules = useMemo(
    () => [
      { ok: password.length >= 8, label: "At least 8 characters" },
      { ok: /\d/.test(password), label: "One number" },
      { ok: password.length > 0 && password === confirm, label: "Passwords match" },
    ],
    [password, confirm],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!rules.every((r) => r.ok)) {
      toast.error("Meet all password rules first.");
      return;
    }
    setBusy(true);
    const { error } = await updatePassword(password);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    void navigate({ to: "/sign-in" });
  }

  const form = (
    <form onSubmit={onSubmit} className="flex flex-col gap-[22px]">
      <AuthHeading
        title="Choose a new password"
        body="Use at least 8 characters. You’ll be signed out on other devices."
      />
      <Field label="New password">
        <TextInput
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
      </Field>
      <Field label="Confirm password">
        <TextInput
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
      </Field>
      <ul className="flex flex-col gap-2">
        {rules.map((r) => (
          <li key={r.label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-[22px] items-center justify-center rounded-full",
                r.ok ? "bg-blush" : "bg-muted",
              )}
            >
              {r.ok ? <Icon name="check" size={14} /> : null}
            </span>
            <span className="type-body-s text-foreground">{r.label}</span>
          </li>
        ))}
      </ul>
      <button
        type="submit"
        disabled={busy}
        className={buttonClass({ variant: "emphasis", full: true })}
      >
        {busy ? "Saving…" : "Update password"}
      </button>
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
          {form}
        </AuthSplit>
      </div>
      <MobileAuthChrome
        step={1}
        onBack={() => window.history.back()}
        bottom={
          <button
            type="button"
            disabled={busy}
            onClick={(e) => void onSubmit(e as unknown as FormEvent)}
            className={buttonClass({ variant: "emphasis", full: true })}
          >
            {busy ? "Saving…" : "Update password"}
          </button>
        }
      >
        <AuthHeading
          title="Choose a new password"
          body="Use at least 8 characters. You’ll be signed out on other devices."
        />
        <Field label="New password">
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Confirm password">
          <TextInput type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <ul className="flex flex-col gap-2">
          {rules.map((r) => (
            <li key={r.label} className="flex items-center gap-2 type-body-s">
              {r.ok ? "✓" : "○"} {r.label}
            </li>
          ))}
        </ul>
      </MobileAuthChrome>
    </>
  );
}
