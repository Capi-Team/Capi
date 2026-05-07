import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import ResourcesClient from "@/components/workspace-resources/resources-client";

export default async function ResourcesPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/auth/login");
  if (!session.activeWorkspaceId) redirect("/dashboard");
  if (
    session.activeWorkspaceRole !== "OWNER" &&
    session.activeWorkspaceRole !== "ADMIN" &&
    session.activeWorkspaceRole !== "MEMBER"
  ) {
    redirect("/dashboard/unauthorized");
  }

  return <ResourcesClient />;
}
