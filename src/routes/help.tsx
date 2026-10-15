import { createFileRoute } from "@tanstack/react-router";
import { SitePage } from "@/components/site/SitePage";
import { HelpPage } from "@/components/site/help/HelpPage";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help centre — Beauty Wallet" },
      {
        name: "description",
        content:
          "Search for coins, bookings, payments and more. Browse topics or read popular Beauty Wallet articles.",
      },
    ],
  }),
  component: HelpRoute,
});

function HelpRoute() {
  return (
    <SitePage>
      <HelpPage />
    </SitePage>
  );
}
