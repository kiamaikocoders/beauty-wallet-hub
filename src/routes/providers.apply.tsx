import { createFileRoute } from "@tanstack/react-router";
import { SitePage } from "@/components/site/SitePage";
import { ApplyWizard } from "@/components/site/provider-apply/ApplyWizard";

export const Route = createFileRoute("/providers/apply")({
  head: () => ({
    meta: [
      { title: "Apply as a provider — Beauty Wallet" },
      {
        name: "description",
        content:
          "Apply to join Beauty Wallet. Tell us about your salon, barbershop or spa — free to list, weekly payouts.",
      },
    ],
  }),
  component: ProviderApplyPage,
});

function ProviderApplyPage() {
  return (
    <SitePage footer={false}>
      <ApplyWizard />
    </SitePage>
  );
}
