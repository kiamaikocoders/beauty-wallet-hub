import { useEffect, useState } from "react";
import { toast } from "sonner";
import { buttonClass } from "@/components/site/primitives";
import {
  disablePush,
  enablePush,
  readPushStatus,
  sendTestPush,
  type PushStatus,
} from "@/lib/push";

const copy: Record<Exclude<PushStatus, "loading">, string> = {
  unconfigured: "Push is not set up on this server yet.",
  unsupported: "This browser cannot receive push notifications.",
  denied: "Notifications are blocked. Allow them in the browser site settings, then reload.",
  off: "Get booking and wallet updates on this device, including when the app is closed.",
  on: "This browser will receive booking and wallet updates.",
};

export function PushCard({ signedIn }: { signedIn: boolean }) {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void readPushStatus().then((next) => {
      if (!cancelled) setStatus(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function turnOn() {
    setBusy(true);
    try {
      const result = await enablePush();
      if (!result.ok) {
        toast.error(result.error);
        setStatus(await readPushStatus());
        return;
      }
      setStatus("on");
      toast.success("Push is on for this device");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not turn on push");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    try {
      const result = await disablePush();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setStatus("off");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not turn off push");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    try {
      const result = await sendTestPush();
      if (!result.ok) {
        toast.error(result.error ?? "Could not send a test");
        return;
      }
      toast.success("Test sent");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="type-body-s-semibold">Push on this device</h2>
          <p className="mt-1 type-body-s text-muted-foreground">
            {status === "loading" ? "Checking this browser…" : copy[status]}
          </p>
        </div>
      </div>
      {signedIn && status === "off" ? (
        <button
          type="button"
          className={buttonClass({ size: "s", className: "mt-4" })}
          disabled={busy}
          onClick={() => void turnOn()}
        >
          Turn on notifications
        </button>
      ) : null}
      {signedIn && status === "on" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={buttonClass({ size: "s" })}
            disabled={busy}
            onClick={() => void sendTest()}
          >
            Send a test
          </button>
          <button
            type="button"
            className={buttonClass({ size: "s", variant: "secondary" })}
            disabled={busy}
            onClick={() => void turnOff()}
          >
            Turn off
          </button>
        </div>
      ) : null}
      {!signedIn && status !== "unsupported" && status !== "unconfigured" ? (
        <p className="mt-3 type-caption text-muted-foreground">Sign in to turn on push.</p>
      ) : null}
    </section>
  );
}
