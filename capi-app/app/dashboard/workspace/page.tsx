import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import WorkspaceAiClient from "@/components/workspace-ai/workspace-ai-client";

export default async function WorkspaceAiPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/auth/login");
  if (!session.activeWorkspaceId) {
    redirect("/dashboard");
  }

  return <WorkspaceAiClient />;
}
