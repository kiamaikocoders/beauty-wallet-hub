import { createFileRoute } from "@tanstack/react-router";
import { HealthPage } from "@/components/admin/HealthAuditPages";

export const Route = createFileRoute("/admin/health")({
  component: HealthPage,
});
