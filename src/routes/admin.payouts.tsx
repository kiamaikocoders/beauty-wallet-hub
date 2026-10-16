import { createFileRoute } from "@tanstack/react-router";
import { PayoutsPage } from "@/components/admin/OpsPages";

export const Route = createFileRoute("/admin/payouts")({
  component: PayoutsPage,
});
