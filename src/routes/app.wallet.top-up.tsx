import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useMember } from "@/components/app/MemberContext";
import { buttonClass } from "@/components/site/primitives";
import { topUpCoins } from "@/lib/app-data";
import { firstName } from "@/lib/onboarding";
import { ksh, num } from "@/lib/pricing";
import { notifyEmail } from "@/lib/resend";
import { cn } from "@/lib/utils";

const PACKS = [100, 250, 500];

export const Route = createFileRoute("/app/wallet/top-up")({
  validateSearch: (raw: Record<string, unknown>) => ({
    demo: typeof raw["demo"] === "string" ? raw["demo"] : undefined,
    coins:
      typeof raw["coins"] === "number"
        ? raw["coins"]
        : typeof raw["coins"] === "string"
          ? Number(raw["coins"])
          : undefined,
  }),
  component: TopUpPage,
});

function TopUpPage() {
  const search = Route.useSearch();
  const { member, demo, refresh } = useMember();
  const navigate = useNavigate();
  const [pack, setPack] = useState(
    search.coins && PACKS.includes(search.coins) ? search.coins : 250,
  );
  const [method, setMethod] = useState<"mpesa" | "card">("mpesa");
  const [phone, setPhone] = useState(member?.phone ?? "0712 345 678");
  const [busy, setBusy] = useState(false);

  if (!member) return null;

  return (
    <div className="mx-auto max-w-lg">
      <Link
        to="/app/wallet"
        search={(demo ? { demo } : {}) as never}
        className="type-body-s text-burgundy"
      >
        ← Wallet
      </Link>
      <h1 className="mt-4 type-h2">Top up coins</h1>
      <p className="mt-2 type-body-s text-muted-foreground">
        1 coin = Ksh 10. Top-up coins go straight into your available balance.
      </p>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {PACKS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setPack(c)}
            className={cn(
              "rounded-xl border p-4 text-center",
              pack === c ? "border-burgundy bg-blush-subtle" : "border-border bg-card",
            )}
          >
            <p className="type-body-s-semibold">{c} coins</p>
            <p className="type-caption text-muted-foreground">{ksh(c * 10)}</p>
          </button>
        ))}
      </div>
      <p className="mt-6 type-body-s-semibold">Pay with</p>
      <div className="mt-2 flex gap-2">
        {(["mpesa", "card"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={cn(
              "min-h-11 rounded-full border px-4 capitalize type-body-s-semibold",
              method === m ? "border-primary bg-primary text-primary-foreground" : "border-border",
            )}
          >
            {m === "mpesa" ? "M-Pesa" : "Card"}
          </button>
        ))}
      </div>
      {method === "mpesa" && (
        <label className="mt-4 block">
          <span className="type-body-s-semibold">M-Pesa phone number</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 type-body-m"
          />
        </label>
      )}
      <div className="mt-6 space-y-2 rounded-xl bg-muted p-4 type-body-s">
        <div className="flex justify-between">
          <span>Top-up</span>
          <span>{pack} coins</span>
        </div>
        <div className="flex justify-between">
          <span>Price</span>
          <span>{ksh(pack * 10)}</span>
        </div>
        <div className="flex justify-between">
          <span>Available after top-up</span>
          <span>
            {num(member.wallet.available)} → {num(member.wallet.available + pack)} coins
          </span>
        </div>
      </div>
      <button
        type="button"
        disabled={busy}
        className={buttonClass({ full: true, className: "mt-6" })}
        onClick={async () => {
          setBusy(true);
          try {
            const result = await topUpCoins({ coins: pack, method, phone, demo });
            if (member.email) {
              notifyEmail({
                to: member.email,
                template: "top-up",
                data: {
                  firstName: firstName(member.fullName),
                  coinsAdded: num(result.coins),
                  amount: ksh(result.priceKsh),
                  paidWith: method === "card" ? "Card" : `M-Pesa ${phone}`,
                  walletNow: num(result.available),
                  ctaUrl: `${window.location.origin}/app/wallet${demo ? `?demo=${demo}` : ""}`,
                },
              });
            }
            refresh();
            toast.success(`${pack} coins added`);
            void navigate({
              to: "/app/wallet",
              search: { success: true, ...(demo ? { demo } : {}) } as never,
            });
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Top-up failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        Pay {ksh(pack * 10)}
      </button>
      {method === "mpesa" && (
        <p className="mt-3 text-center type-caption text-muted-foreground">
          We’ll send an M-Pesa request to {phone}.
        </p>
      )}
    </div>
  );
}
