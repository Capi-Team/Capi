import { db } from "@/lib/db";

const DEFAULT_CONTEXT =
  "Define aquí la documentación, procesos y políticas internas de la empresa. Un administrador puede completar este contexto desde el panel del asistente.";

// Fallback: tu schema actual no incluye workspaceAIConfig.
// Para no romper el UI, devolvemos un config default en memoria cuando no exista persistencia.
export async function ensureWorkspaceAIConfig(workspaceId: number, fallbackCompanyName: string) {
  try {
    const existing = await (db as any).workspaceAIConfig?.findUnique?.({
      where: { workspaceId },
    });
    if (existing) return existing;

    // Si no existe el modelo en Prisma, cae al fallback.
    if (!(db as any).workspaceAIConfig?.create) {
      return {
        id: -1,
        workspaceId,
        companyName: fallbackCompanyName.slice(0, 255) || "Workspace",
        aiContext: DEFAULT_CONTEXT,
        welcomeMessage: null,
        userInstructions: null,
        strictMode: true,
        updatedAt: new Date(),
      };
    }

    return (db as any).workspaceAIConfig.create({
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
      updatedAt: new Date(),
    };
  }
}

