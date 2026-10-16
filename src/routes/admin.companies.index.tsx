import { createFileRoute } from "@tanstack/react-router";
import { CompaniesPage } from "@/components/admin/GiftsCompaniesPages";

export const Route = createFileRoute("/admin/companies/")({
  component: CompaniesPage,
});
