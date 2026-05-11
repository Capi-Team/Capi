import { db } from "@/lib/db";

const DEFAULT_CONTEXT =
  "Define aquí la documentación, procesos y políticas internas de la empresa. Un administrador puede completar este contexto desde el panel del asistente.";

export async function ensureWorkspaceAIConfig(workspaceId: number, fallbackCompanyName: string) {
  try {
    const existing = await db.workspaceAIConfig.findUnique({
      where: { workspaceId },
    });
    if (existing) return existing;

    return await db.workspaceAIConfig.create({
      data: {
        workspaceId,
        companyName: fallbackCompanyName.slice(0, 255) || "Workspace",
        aiContext: DEFAULT_CONTEXT,
        strictMode: true,
      },
    });
  } catch {
    return {
      id: -1,
      workspaceId,
      companyName: fallbackCompanyName.slice(0, 255) || "Workspace",
      aiContext: DEFAULT_CONTEXT,
      welcomeMessage: null,
      userInstructions: null,
      strictMode: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
