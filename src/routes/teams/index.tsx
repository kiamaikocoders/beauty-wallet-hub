import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SitePage } from "@/components/site/SitePage";
import { TeamsPage } from "@/components/site/teams/TeamsPage";
import { TeamsOverview } from "@/components/teams/TeamsOverview";
import { InviteSheet } from "@/components/teams/TeamsSheets";
import { fetchRules } from "@/lib/catalog";
import { DEFAULT_RULES } from "@/lib/pricing";
import { isTeamsHrSession, setTeamsHrSession } from "@/lib/teams-demo";

export const Route = createFileRoute("/teams/")({
  validateSearch: (s: Record<string, unknown>): { hr?: string } => {
    const hr = s["hr"];
    return typeof hr === "string" ? { hr } : {};
  },
  loader: async () => {
    try {
      return { rules: await fetchRules() };
    } catch {
      return { rules: DEFAULT_RULES };
    }
  },
  component: TeamsIndexRoute,
});

function TeamsIndexRoute() {
  const { rules } = Route.useLoaderData();
  const { hr } = Route.useSearch();
  const [hrMode, setHrMode] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    if (hr === "1") {
      setTeamsHrSession(true);
      setHrMode(true);
      return;
    }
    setHrMode(isTeamsHrSession());
  }, [hr]);

  if (hrMode) {
    return (
      <>
        <TeamsOverview onInvite={() => setInviteOpen(true)} />
        <InviteSheet open={inviteOpen} onClose={() => setInviteOpen(false)} />
      </>
    );
  }

  return (
    <SitePage>
      <TeamsPage rules={rules} />
      <div className="px-5 pb-10 lg:px-16">
        <p className="type-caption text-muted-foreground">
          HR demo:{" "}
          <a href="/teams?hr=1" className="text-burgundy underline-offset-2 hover:underline">
            open the Teams portal
          </a>{" "}
          ·{" "}
          <a href="/teams/signup" className="text-burgundy underline-offset-2 hover:underline">
            company sign-up
          </a>
        </p>
      </div>
    </SitePage>
  );
}
