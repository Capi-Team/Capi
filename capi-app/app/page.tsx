import { getCurrentSession } from "@/lib/auth";
import { HomeLanding } from "@/components/home/home-landing";

export default async function Home() {
  const session = await getCurrentSession();
  return (
    <HomeLanding
      isAuthenticated={session !== null}
      sessionEmail={session?.email ?? null}
      activeWorkspaceRole={session?.activeWorkspaceRole ?? null}
      hasWorkspace={typeof session?.activeWorkspaceId === "number"}
    />
  );
}
