import { createFileRoute } from "@tanstack/react-router";
import { SitePage } from "@/components/site/SitePage";
import { TeamsPage } from "@/components/site/teams/TeamsPage";
import { fetchRules } from "@/lib/catalog";
import { DEFAULT_RULES } from "@/lib/pricing";

export const Route = createFileRoute("/teams")({
  head: () => ({
    meta: [
      { title: "For teams — Beauty Wallet" },
      {
        name: "description",
        content:
          "Give your team a monthly coin wallet for salons, barbers and spas across Nairobi. One invoice, no receipts to chase.",
      },
    ],
  }),
  loader: async () => {
    try {
      return { rules: await fetchRules() };
    } catch {
      return { rules: DEFAULT_RULES };
    }
  },
  component: TeamsRoute,
});

function TeamsRoute() {
  const { rules } = Route.useLoaderData();
  return (
    <SitePage>
      <TeamsPage rules={rules} />
    </SitePage>
  );
}
