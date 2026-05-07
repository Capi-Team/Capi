import { db } from "@/lib/db";

const DEFAULT_CONTEXT =
  "Define aquí la documentación, procesos y políticas internas de la empresa. Un administrador puede completar este contexto desde el panel del asistente.";

export async function ensureWorkspaceAIConfig(workspaceId: number, fallbackCompanyName: string) {
  const existing = await db.workspaceAIConfig.findUnique({
    where: { workspaceId },
  });
  if (existing) return existing;

  return db.workspaceAIConfig.create({
    data: {
      workspaceId,
      companyName: fallbackCompanyName.slice(0, 255) || "Workspace",
      aiContext: DEFAULT_CONTEXT,
      strictMode: true,
    },
  });
}
