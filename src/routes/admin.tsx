import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { fetchSignedInRole } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Control Tower — Beauty Wallet Admin" },
      {
        name: "description",
        content: "Operations, provider vetting, coin rules, payouts and disputes.",
      },
      { property: "og:title", content: "Control Tower — Beauty Wallet Admin" },
      {
        property: "og:description",
        content: "Where the Beauty Wallet team runs the business.",
      },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [allowed, setAllowed] = useState(pathname === "/admin/2fa");

  useEffect(() => {
    if (pathname === "/admin/2fa") {
      setAllowed(true);
      return;
    }
    let cancelled = false;
    void fetchSignedInRole().then((role) => {
      if (cancelled) return;
      if (role !== "admin") {
        window.location.href = "/sign-in?as=admin";
        return;
      }
      setAllowed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (pathname === "/admin/2fa") {
    return <Outlet />;
  }
  if (!allowed) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background">
        <p className="type-body-m text-muted-foreground">Checking admin access…</p>
      </main>
    );
  }
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
