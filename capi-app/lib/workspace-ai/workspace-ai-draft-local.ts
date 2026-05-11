const STORAGE_PREFIX = "capi:workspaceAiDraft:v1";

export type WorkspaceAiDraftPayload = {
  workspaceId: number;
  /** `updatedAt` del servidor cuando se cargó / editó este borrador (evita mezclar si la BD cambió). */
  serverUpdatedAt: string;
  companyName: string;
  aiContext: string;
  welcomeMessage: string | null;
  userInstructions: string | null;
  strictMode: boolean;
  savedAt: string;
};

export function workspaceAiDraftStorageKey(workspaceId: number): string {
  return `${STORAGE_PREFIX}:${workspaceId}`;
}

export function readWorkspaceAiDraft(workspaceId: number): WorkspaceAiDraftPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(workspaceAiDraftStorageKey(workspaceId));
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<WorkspaceAiDraftPayload>;
    if (
      typeof data.workspaceId !== "number" ||
      typeof data.serverUpdatedAt !== "string" ||
      typeof data.companyName !== "string" ||
      typeof data.aiContext !== "string" ||
      typeof data.strictMode !== "boolean"
    ) {
      return null;
    }
    return {
      workspaceId: data.workspaceId,
      serverUpdatedAt: data.serverUpdatedAt,
      companyName: data.companyName,
      aiContext: data.aiContext,
      welcomeMessage: typeof data.welcomeMessage === "string" || data.welcomeMessage === null ? data.welcomeMessage : null,
      userInstructions:
        typeof data.userInstructions === "string" || data.userInstructions === null
          ? data.userInstructions
          : null,
      strictMode: data.strictMode,
      savedAt: typeof data.savedAt === "string" ? data.savedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeWorkspaceAiDraft(payload: Omit<WorkspaceAiDraftPayload, "savedAt">): void {
  if (typeof window === "undefined") return;
  const full: WorkspaceAiDraftPayload = {
    ...payload,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(workspaceAiDraftStorageKey(payload.workspaceId), JSON.stringify(full));
}

export function clearWorkspaceAiDraft(workspaceId: number): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(workspaceAiDraftStorageKey(workspaceId));
}

type ServerFullConfig = {
  id: number;
  workspaceId: number;
  updatedAt: string;
  companyName: string;
  aiContext: string;
  welcomeMessage: string | null;
  userInstructions: string | null;
  strictMode: boolean;
};

/**
 * Recupera texto del borrador local solo si sigue alineado con la misma versión del servidor
 * (`updatedAt` igual), para no pisar cambios guardados en otro sitio.
 */
export function mergeServerConfigWithLocalDraft<T extends ServerFullConfig>(server: T): T {
  const local = readWorkspaceAiDraft(server.workspaceId);
  if (!local || local.workspaceId !== server.workspaceId) return server;
  if (local.serverUpdatedAt !== server.updatedAt) return server;
  return {
    ...server,
    companyName: local.companyName,
    aiContext: local.aiContext,
    welcomeMessage: local.welcomeMessage,
    userInstructions: local.userInstructions,
    strictMode: local.strictMode,
  };
}
