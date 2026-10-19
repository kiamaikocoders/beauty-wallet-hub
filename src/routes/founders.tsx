import { createFileRoute } from "@tanstack/react-router";
import { FoundersPage } from "@/components/site/founders/FoundersPage";
import { SitePage } from "@/components/site/SitePage";

export const Route = createFileRoute("/founders")({
  head: () => ({
    meta: [
      { title: "Founders — Beauty Wallet" },
      {
        name: "description",
        content:
          "Mercy founded Beauty Wallet in Nairobi so beauty and grooming could be planned like rent or school fees.",
      },
    ],
  }),
  component: FoundersRoute,
});

function FoundersRoute() {
  return (
    <SitePage>
      <FoundersPage />
    </SitePage>
  );
}
