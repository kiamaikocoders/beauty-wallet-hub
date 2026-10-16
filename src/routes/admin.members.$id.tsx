import { createFileRoute } from "@tanstack/react-router";
import { MemberDetailPage } from "@/components/admin/MembersPages";

export const Route = createFileRoute("/admin/members/$id")({
  component: MemberDetailRoute,
});

function MemberDetailRoute() {
  const { id } = Route.useParams();
  return <MemberDetailPage id={id} />;
}
