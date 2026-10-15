import { createFileRoute } from "@tanstack/react-router";
import { SitePage } from "@/components/site/SitePage";
import { ProvidersMarketing } from "@/components/site/for-providers/ProvidersMarketing";
import { fetchPayoutBands } from "@/lib/providers-data";

export const Route = createFileRoute("/providers/")({
  head: () => ({
    meta: [
      { title: "For providers — Beauty Wallet" },
      {
        name: "description",
        content:
          "Grow your salon with prepaid members. Weekly M-Pesa payouts, PIN check-in, free to list.",
      },
    ],
  }),
  loader: async () => ({ bands: await fetchPayoutBands() }),
  component: ProvidersPage,
});

function ProvidersPage() {
  const { bands } = Route.useLoaderData();
  return (
    <SitePage>
      <ProvidersMarketing bands={bands} />
    </SitePage>
  );
}
