import { createFileRoute } from "@tanstack/react-router";
import { MembersPage } from "@/components/admin/MembersPages";

export const Route = createFileRoute("/admin/members/")({
  component: MembersPage,
});
