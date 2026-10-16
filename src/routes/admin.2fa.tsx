import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AuthHeading, AuthSplit, MobileAuthChrome } from "@/components/site/auth/AuthSplit";
import { AuthCheckbox, OtpInput } from "@/components/site/auth/auth-fields";
import { Icon, buttonClass } from "@/components/site/primitives";
import { supabase } from "@/integrations/supabase/client";
import { sendEmailCode, verifyEmailCode } from "@/lib/resend";

export const Route = createFileRoute("/admin/2fa")({
  head: () => ({
    meta: [
      { title: "Two-step verification — Beauty Wallet Admin" },
      {
        name: "description",
        content: "Enter the 6-digit code we emailed to your admin account.",
      },
    ],
  }),
  component: Admin2faPage,
});

function Admin2faPage() {
  const [code, setCode] = useState("");
  const [trust, setTrust] = useState(true);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [ticket, setTicket] = useState<{ token: string; exp: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      const next = data.user?.email?.trim() ?? "";
      if (!next || cancelled) {
        if (!cancelled && !next) window.location.href = "/sign-in?as=admin";
        return;
      }
      setEmail(next);
      const sent = await sendEmailCode({ data: { email: next, firstName: "Admin" } });
      if (cancelled) return;
      if (!sent.ok || !sent.token || !sent.exp) {
        toast.error(sent.error ?? "Could not email your admin code");
        return;
      }
      setTicket({ token: sent.token, exp: sent.exp });
      toast.success(`Code sent to ${next}`);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (!ticket || !email) {
      toast.error("Wait for the email code, or sign in again.");
      return;
    }
    if (code.length < 6) {
      toast.error("Enter the 6-digit code from your email.");
      return;
    }
    setBusy(true);
    const result = await verifyEmailCode({
      data: { email, code, token: ticket.token, exp: ticket.exp },
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error === "expired" ? "That code expired. Refresh to send a new one." : "That code didn’t match.");
      return;
    }
    if (trust && typeof window !== "undefined") {
      localStorage.setItem("bw_admin_trusted", "1");
    }
    window.location.href = "/admin";
  }

  const form = (
    <form onSubmit={onSubmit} className="flex flex-col gap-[22px]">
      <div className="flex size-16 items-center justify-center rounded-[32px] bg-blush">
        <Icon name="shield-check" size={28} />
      </div>
      <AuthHeading
        title="Two-step verification"
        body={
          email
            ? `Enter the 6-digit code we emailed to ${email}. Authenticator apps come later.`
            : "Sending a code to your admin email."
        }
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
          body={email ? `Enter the code we emailed to ${email}.` : "Sending your admin code."}
        />
        <OtpInput value={code} onChange={setCode} />
        <AuthCheckbox checked={trust} onChange={setTrust}>
          Trust this device for 30 days
        </AuthCheckbox>
      </MobileAuthChrome>
    </>
  );
}
