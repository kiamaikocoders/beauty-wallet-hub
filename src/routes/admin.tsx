import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";

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
  if (pathname === "/admin/2fa") {
    return <Outlet />;
  }
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
