import { Outlet, createFileRoute } from "@tanstack/react-router";
import { PortalProvider } from "@/components/provider/portal-context";
import { loadProviderPortal } from "@/lib/provider-portal-data";

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
  loader: () => loadProviderPortal(),
  component: ProviderLayout,
});

function ProviderLayout() {
  const data = Route.useLoaderData();
  return (
    <PortalProvider value={data}>
      <Outlet />
    </PortalProvider>
  );
}
