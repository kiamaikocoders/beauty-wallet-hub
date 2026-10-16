import { createFileRoute } from "@tanstack/react-router";
import { BookingsPage } from "@/components/admin/OpsPages";

export const Route = createFileRoute("/admin/bookings")({
  component: BookingsPage,
});
