import { createFileRoute } from "@tanstack/react-router";
import { SitePage } from "@/components/site/SitePage";
import { GiftPage } from "@/components/site/gift/GiftPage";
import { fetchRules } from "@/lib/catalog";
import { DEFAULT_RULES } from "@/lib/pricing";

export const Route = createFileRoute("/gift")({
  head: () => ({
    meta: [
      { title: "Gift a wallet — Beauty Wallet" },
      {
        name: "description",
        content:
          "Send a month of Beauty Wallet coins to a friend, partner or mum. They pick the salon, barber or spa.",
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
  component: GiftRoute,
});

function GiftRoute() {
  const { rules } = Route.useLoaderData();
  return (
    <SitePage>
      <GiftPage rules={rules} />
    </SitePage>
  );
}
