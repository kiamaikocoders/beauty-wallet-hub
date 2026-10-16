import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AuthHeading, AuthSplit, MobileAuthChrome } from "@/components/site/auth/AuthSplit";
import { AuthCheckbox, OtpInput } from "@/components/site/auth/auth-fields";
import { Icon, buttonClass } from "@/components/site/primitives";

export const Route = createFileRoute("/admin/2fa")({
  head: () => ({
    meta: [
      { title: "Two-step verification — Beauty Wallet Admin" },
      {
        name: "description",
        content: "Enter the 6-digit code from your authenticator app.",
      },
    ],
  }),
  component: Admin2faPage,
});

function Admin2faPage() {
  const [code, setCode] = useState("");
  const [trust, setTrust] = useState(true);
  const [busy, setBusy] = useState(false);
  const email = "faith.njeri@beautywallet.co.ke";

  function onSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (code.length < 6) {
      toast.error("Enter the 6-digit authenticator code.");
      return;
    }
    setBusy(true);
    // Admin TOTP is not wired to a real MFA factor yet — accept any 6 digits for the UI flow.
    window.setTimeout(() => {
      setBusy(false);
      if (trust && typeof window !== "undefined") {
        localStorage.setItem("bw_admin_trusted", "1");
      }
      window.location.href = "/admin";
    }, 600);
  }

  const form = (
    <form onSubmit={onSubmit} className="flex flex-col gap-[22px]">
      <div className="flex size-16 items-center justify-center rounded-[32px] bg-blush">
        <Icon name="shield-check" size={28} />
      </div>
      <AuthHeading
        title="Two-step verification"
        body={`Enter the 6-digit code from your authenticator app for ${email}.`}
      />
      <OtpInput value={code} onChange={setCode} />
      <AuthCheckbox checked={trust} onChange={setTrust}>
        Trust this device for 30 days
      </AuthCheckbox>
      <button
        type="submit"
        disabled={busy}
        className={buttonClass({ variant: "emphasis", full: true })}
      >
        {busy ? "Verifying…" : "Verify and continue"}
      </button>
    </form>
  );

  return (
    <>
      <div className="hidden lg:block">
        <AuthSplit
          admin
          topRight={
            <button type="button" className="type-body-s-semibold text-burgundy">
              Use a backup code
            </button>
          }
          panelImage=""
          panelEyebrow="Control tower"
          panelQuote="Restricted to Beauty Wallet staff."
          panelAttribution="Every sign-in is logged with device and location. Codes rotate every 30 seconds."
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
            onClick={() => onSubmit()}
            className={buttonClass({ variant: "emphasis", full: true })}
          >
            {busy ? "Verifying…" : "Verify and continue"}
          </button>
        }
      >
        <div className="flex size-16 items-center justify-center rounded-[32px] bg-blush">
          <Icon name="shield-check" size={28} />
        </div>
        <AuthHeading
          title="Two-step verification"
          body={`Enter the code from your authenticator for ${email}.`}
        />
        <OtpInput value={code} onChange={setCode} />
        <AuthCheckbox checked={trust} onChange={setTrust}>
          Trust this device for 30 days
        </AuthCheckbox>
      </MobileAuthChrome>
    </>
  );
}
