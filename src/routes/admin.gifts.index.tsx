import { createFileRoute } from "@tanstack/react-router";
import { GiftsPage } from "@/components/admin/GiftsCompaniesPages";

export const Route = createFileRoute("/admin/gifts/")({
  component: GiftsPage,
});
