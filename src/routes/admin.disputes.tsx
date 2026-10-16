import { createFileRoute } from "@tanstack/react-router";
import { DisputesPage } from "@/components/admin/OpsPages";

export const Route = createFileRoute("/admin/disputes")({
  component: DisputesPage,
});
