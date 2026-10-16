import { createFileRoute, redirect } from "@tanstack/react-router";
import { TeamsStaff } from "@/components/teams/TeamsStaff";
import { isTeamsHrSession } from "@/lib/teams-demo";

export const Route = createFileRoute("/teams/staff")({
  validateSearch: (s: Record<string, unknown>): { invite?: string } => {
    const invite = s["invite"];
    return typeof invite === "string" ? { invite } : {};
  },
  beforeLoad: () => {
    if (typeof window !== "undefined" && !isTeamsHrSession()) {
      throw redirect({ to: "/teams", search: { hr: "1" } as never });
    }
  },
  head: () => ({
    meta: [{ title: "Staff — Teams — Beauty Wallet" }],
  }),
  component: TeamsStaffRoute,
});

function TeamsStaffRoute() {
  const { invite } = Route.useSearch();
  return <TeamsStaff openInvite={invite === "1"} />;
}
