import { createFileRoute, redirect } from "@tanstack/react-router";
import { TeamsSettings } from "@/components/teams/TeamsSettings";
import { isTeamsHrSession } from "@/lib/teams-demo";

export const Route = createFileRoute("/teams/settings")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !isTeamsHrSession()) {
      throw redirect({ to: "/teams", search: { hr: "1" } as never });
    }
  },
  head: () => ({
    meta: [{ title: "Settings — Teams — Beauty Wallet" }],
  }),
  component: () => <TeamsSettings />,
});
