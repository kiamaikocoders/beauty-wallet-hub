import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { PortalProvider } from "@/components/provider/portal-context";
import { Logo, buttonClass } from "@/components/site/primitives";
import { supabase } from "@/integrations/supabase/client";
import { fetchSignedInRole } from "@/lib/auth";
import { fetchMyProvider, statusHeadline, type MyProvider } from "@/lib/admin-ops";
import { loadProviderPortal, type PortalData } from "@/lib/provider-portal-data";

export const Route = createFileRoute("/provider")({
  head: () => ({
    meta: [
      { title: "Provider — Beauty Wallet" },
      {
        name: "description",
        content: "Today’s visits, PIN check-in, services, team and weekly payouts.",
      },
    ],
  }),
  component: ProviderLayout,
});

function ProviderLayout() {
  const searchStr = useRouterState({ select: (state) => state.location.searchStr });
  const requested = new URLSearchParams(searchStr.replace(/^\?/, "")).get("studio") ?? "";
  const [phase, setPhase] = useState<"loading" | "signed-out" | "none" | "waiting" | "ready">("loading");
  const [mine, setMine] = useState<MyProvider | null>(null);
  const [data, setData] = useState<PortalData | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [viewing, setViewing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!auth.user) {
        setPhase("signed-out");
        return;
      }
      const stored = window.sessionStorage.getItem("bw-admin-studio") ?? "";
      const slug = requested || stored;
      if (slug) {
        const role = await fetchSignedInRole();
        if (cancelled) return;
        if (role !== "admin") {
          window.sessionStorage.removeItem("bw-admin-studio");
          setProblem("Only an admin can open another studio.");
          setPhase("none");
          return;
        }
        window.sessionStorage.setItem("bw-admin-studio", slug);
        try {
          const portal = await loadProviderPortal(slug);
          if (cancelled) return;
          setData(portal);
          setViewing(true);
          setPhase("ready");
        } catch (err) {
          window.sessionStorage.removeItem("bw-admin-studio");
          if (!cancelled) {
            setProblem(err instanceof Error ? err.message : "Could not open that studio");
            setPhase("none");
          }
        }
        return;
      }
      try {
        const studio = await fetchMyProvider();
        if (cancelled) return;
        if (!studio) {
          setPhase("none");
          return;
        }
        setMine(studio);
        if (studio.status !== "live") {
          setPhase("waiting");
          return;
        }
        const portal = await loadProviderPortal(studio.slug);
        if (cancelled) return;
        setData(portal);
        setPhase("ready");
      } catch (err) {
        if (!cancelled) {
          setProblem(err instanceof Error ? err.message : null);
          setPhase("none");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requested]);

  if (phase === "loading") {
    return (
      <main className="grid min-h-dvh place-items-center bg-background">
        <p className="type-body-m text-muted-foreground">Opening your studio…</p>
      </main>
    );
  }

  if (phase === "signed-out") {
    return (
      <Gate
        title="Sign in to your studio"
        body="Use the email on the application. A studio that is still in review stays on the status page until it is approved."
        action={
          <Link to="/sign-in" search={{ as: "provider" }} className={buttonClass()}>
            Sign in
          </Link>
        }
      />
    );
  }

  if (phase === "none") {
    return (
      <Gate
        title={problem ? "Studio not opened" : "No studio on this login"}
        body={
          problem ||
          "This account is not linked to an application. Apply with this email, or open the status link from the confirmation email."
        }
        action={
          <Link to="/providers/apply" className={buttonClass()}>
            Apply as a provider
          </Link>
        }
      />
    );
  }

  if (phase === "waiting" && mine) {
    return (
      <Gate
        title={statusHeadline(mine.status, mine.reviewNote)}
        body={
          mine.reviewNote ||
          `${mine.name} is not bookable yet. The status page is the same record the admin updates.`
        }
        action={
          <Link
            to="/providers/status"
            search={{ ref: mine.ref ?? "", name: mine.name, area: mine.area }}
            className={buttonClass()}
          >
            Open application status
          </Link>
        }
      />
    );
  }

  if (!data) return null;

  return (
    <PortalProvider value={data}>
      {viewing && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-primary px-5 py-3 text-primary-foreground">
          <p className="type-body-s-semibold">Viewing {data.provider.name} as an admin</p>
          <Link
            to="/admin/providers/$slug"
            params={{ slug: data.provider.slug }}
            className="type-body-s-semibold text-gold"
            onClick={() => window.sessionStorage.removeItem("bw-admin-studio")}
          >
            Exit
          </Link>
        </div>
      )}
      <Outlet />
    </PortalProvider>
  );
}

function Gate({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action: ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-background">
      <header className="flex h-16 items-center px-5">
        <Link to="/">
          <Logo />
        </Link>
      </header>
      <div className="mx-auto flex max-w-lg flex-col gap-4 px-5 py-16">
        <p className="type-eyebrow text-burgundy">Provider</p>
        <h1 className="type-h2">{title}</h1>
        <p className="type-body-m text-muted-foreground">{body}</p>
        {action}
      </div>
    </main>
  );
}
