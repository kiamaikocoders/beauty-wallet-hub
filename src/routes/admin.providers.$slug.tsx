import { createFileRoute } from "@tanstack/react-router";
import { ProviderApplicationPage } from "@/components/admin/ProvidersPages";

export const Route = createFileRoute("/admin/providers/$slug")({
  component: ProviderApplicationRoute,
});

function ProviderApplicationRoute() {
  const { slug } = Route.useParams();
  return <ProviderApplicationPage slug={slug} />;
}
