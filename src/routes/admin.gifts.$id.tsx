import { createFileRoute } from "@tanstack/react-router";
import { GiftDetailPage } from "@/components/admin/GiftsCompaniesPages";

export const Route = createFileRoute("/admin/gifts/$id")({
  component: GiftDetailRoute,
});

function GiftDetailRoute() {
  const { id } = Route.useParams();
  return <GiftDetailPage id={id} />;
}
