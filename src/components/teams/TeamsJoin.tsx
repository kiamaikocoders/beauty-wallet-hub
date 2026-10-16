import { Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Logo, TierBadge, buttonClass } from "@/components/site/primitives";
import { supabase } from "@/integrations/supabase/client";
import { TEAMS_DEMO } from "@/lib/teams-demo";
import { num } from "@/lib/pricing";

export function TeamsJoin({ code }: { code: string }) {
  const invite = TEAMS_DEMO.joinInvite;
  const [phone, setPhone] = useState(invite.phone);
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { error: rpcError } = await supabase.rpc(
        "teams_accept_invite" as never,
        {
          p_code: code,
          p_phone: phone,
        } as never,
      );
      if (rpcError) {
        // Demo codes always succeed in UI
        console.info("[teams] accept_invite", rpcError.message);
      }
      setJoined(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (joined) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-5">
        <Logo />
        <h1 className="type-h1 mt-8 text-center">You’re in, {invite.firstName}</h1>
        <p className="type-body-l mt-3 max-w-md text-center text-muted-foreground">
          Your {num(invite.coins)} coins are ready. Open the app to book your first visit.
        </p>
        <a href="/app" className={buttonClass({ variant: "emphasis", className: "mt-8" })}>
          Open Beauty Wallet
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-dvh w-full bg-background">
      <div className="mx-auto flex w-full max-w-lg flex-col px-5 py-10 lg:max-w-none lg:flex-row lg:px-16 lg:py-12">
        <div className="flex w-full flex-col lg:max-w-xl">
          <div className="flex items-center justify-between">
            <Logo />
            <a href="/sign-in" className="type-body-s-semibold text-burgundy">
              Have an account? Sign in
            </a>
          </div>
          <p className="type-eyebrow mt-10">From your employer</p>
          <h1 className="type-h1 mt-3">{invite.firstName}, your team perk is here</h1>
          <p className="type-body-l mt-3 text-muted-foreground">
            {TEAMS_DEMO.company} gives you {num(invite.coins)} coins every month for salons, barbers
            and spas across Nairobi.
          </p>

          <div className="mt-6 rounded-lg border border-border bg-card p-5">
            <p className="type-eyebrow">{TEAMS_DEMO.company}</p>
            <div className="mt-3 flex items-center gap-3">
              <TierBadge tier={invite.tier} />
              <p className="type-stat">
                {num(invite.coins)}{" "}
                <span className="type-body-m text-muted-foreground">coins a month</span>
              </p>
            </div>
            <p className="type-body-s mt-2 text-muted-foreground">
              New coins on the 1st, paid by your employer
            </p>
            <p className="type-body-m mt-4 italic">“{invite.message}”</p>
            <p className="type-caption mt-2 text-muted-foreground">{invite.from}</p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="type-body-s-medium">Your phone number</span>
              <div className="flex gap-2">
                <span className="inline-flex min-h-[52px] items-center rounded-md border border-border bg-muted px-3 type-body-m">
                  +254
                </span>
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="min-h-[52px] flex-1 rounded-md border border-border bg-card px-4 type-body-m outline-none focus:border-foreground"
                />
              </div>
              <span className="type-caption text-muted-foreground">
                We’ll text you a 6-digit code. No card or payment needed.
              </span>
            </label>
            {error && <p className="type-body-s text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className={buttonClass({ variant: "emphasis", full: true })}
            >
              Join and get my coins
            </button>
          </form>
          <p className="type-caption mt-4 text-muted-foreground">
            {TEAMS_DEMO.company} sees how many coins you use, never what you book.
          </p>
          <p className="type-caption mt-8 text-muted-foreground">
            © 2026 Beauty Wallet Ltd ·{" "}
            <Link to="/legal/$doc" params={{ doc: "privacy" }}>
              Privacy
            </Link>{" "}
            ·{" "}
            <Link to="/legal/$doc" params={{ doc: "terms" }}>
              Terms
            </Link>
          </p>
        </div>
        <div className="mt-10 hidden flex-1 items-end justify-center lg:flex">
          <div className="max-w-sm rounded-2xl bg-primary p-8 text-primary-foreground">
            <p className="type-eyebrow text-gold">What you can book</p>
            <p className="type-h3 mt-3">A fresh cut before Monday’s meeting, on your employer.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
