import { createFileRoute } from "@tanstack/react-router";
import { SitePage } from "@/components/site/SitePage";
import { AboutPage } from "@/components/site/about/AboutPage";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About us — Beauty Wallet" },
      {
        name: "description",
        content:
          "Beauty and grooming, planned like everything else that matters. Why we started Beauty Wallet in Nairobi.",
      },
    ],
  }),
  component: AboutRoute,
});

function AboutRoute() {
  return (
    <SitePage>
      <AboutPage />
    </SitePage>
  );
}
