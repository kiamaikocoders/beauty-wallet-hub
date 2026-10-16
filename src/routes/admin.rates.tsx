import { createFileRoute } from "@tanstack/react-router";
import { RatesPage } from "@/components/admin/RatesPage";

export const Route = createFileRoute("/admin/rates")({
  component: RatesPage,
});
