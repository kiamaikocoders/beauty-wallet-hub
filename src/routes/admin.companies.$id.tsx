import { createFileRoute } from "@tanstack/react-router";
import { CompanyDetailPage } from "@/components/admin/GiftsCompaniesPages";

export const Route = createFileRoute("/admin/companies/$id")({
  component: CompanyDetailRoute,
});

function CompanyDetailRoute() {
  const { id } = Route.useParams();
  return <CompanyDetailPage id={id} />;
}
