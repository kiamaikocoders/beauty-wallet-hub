import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PortalProvider } from "@/components/provider/portal-context";
import { supabase } from "@/integrations/supabase/client";
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
  loader: () => loadProviderPortal(),
  component: ProviderLayout,
});

function ProviderLayout() {
  const initial = Route.useLoaderData();
  const [data, setData] = useState<PortalData>(initial);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || cancelled) return;
      const { data: rows } = await supabase.from("providers").select("slug").limit(1);
      const slug = rows?.[0]?.slug;
      if (!slug || cancelled) return;
      const next = await loadProviderPortal(slug);
      if (!cancelled) setData(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PortalProvider value={data}>
      <Outlet />
    </PortalProvider>
  );
}
