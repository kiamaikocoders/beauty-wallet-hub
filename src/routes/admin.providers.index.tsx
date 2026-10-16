import { createFileRoute } from "@tanstack/react-router";
import { ProvidersPage } from "@/components/admin/ProvidersPages";

export const Route = createFileRoute("/admin/providers/")({
  component: ProvidersPage,
});
