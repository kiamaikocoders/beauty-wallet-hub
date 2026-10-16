import { createFileRoute } from "@tanstack/react-router";
import { FinancePage } from "@/components/admin/OpsPages";

export const Route = createFileRoute("/admin/finance")({
  component: FinancePage,
});
