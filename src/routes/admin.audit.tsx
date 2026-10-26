import { createFileRoute } from "@tanstack/react-router";
import { AuditPage } from "@/components/admin/HealthAuditPages";

export const Route = createFileRoute("/admin/audit")({
  component: AuditPage,
});
