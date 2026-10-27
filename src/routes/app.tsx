import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { MemberProvider } from "@/components/app/MemberContext";
import { demoKeyFromSearch, fetchMemberSession, type MemberSession } from "@/lib/app-data";
import { supabase } from "@/integrations/supabase/client";

export type AppSearch = { demo?: string };

export const Route = createFileRoute("/app")({
  validateSearch: (raw: Record<string, unknown>): AppSearch => {
    const demo = typeof raw["demo"] === "string" ? raw["demo"] : undefined;
    return demo ? { demo } : {};
  },
  head: () => ({
    meta: [
      { title: "Beauty Wallet" },
      { name: "description", content: "Your coins, bookings and arrival passes." },
    ],
  }),
  component: AppLayout,
});

function AppLayout() {
  const search = Route.useSearch();
  const router = useRouter();
  const demo = demoKeyFromSearch(search.demo);
  const [member, setMember] = useState<MemberSession | null | undefined>(undefined);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getSession();
      const session = await fetchMemberSession(demo).catch(() => null);
      if (!cancelled) {
        setMember(session);
        if (!session && !demo && !auth.session) {
          /* sign-in CTA via AppShell */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [demo, tick]);

  useEffect(() => {
    if (!member || demo) return;
    void import("@/lib/push").then(({ syncPushIfAllowed }) => syncPushIfAllowed());
  }, [member, demo]);

  if (member && !member.tier && !demo) {
    if (typeof window !== "undefined") window.location.href = "/join/plan";
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="type-body-m text-muted-foreground">Choose a plan to open your wallet…</p>
      </main>
    );
  }

  if (member === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="type-body-m text-muted-foreground">Loading your wallet…</p>
      </main>
    );
  }

  return (
    <MemberProvider
      member={member}
      demo={demo}
      refresh={() => {
        setTick((t) => t + 1);
        void router.invalidate();
      }}
    >
      <AppShell />
    </MemberProvider>
  );
}
