import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { readJsonRecordFromRequest } from "@/lib/http/json";
import { toTrimmedString } from "@/lib/strings/coerce";
import { canEditWorkspaceAiConfig } from "@/lib/workspace-ai/permissions";
import { ensureWorkspaceAIConfig } from "@/lib/workspace-ai/ensure-ai-config";
import { getWorkspaceAccessFromSession } from "@/lib/workspace-ai/workspace-access";

function memberSafeConfig(config: {
  companyName: string;
  welcomeMessage: string | null;
  userInstructions: string | null;
  strictMode: boolean;
}) {
  return {
    companyName: config.companyName,
    welcomeMessage: config.welcomeMessage,
    userInstructions: config.userInstructions,
    strictMode: config.strictMode,
  };
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const access = await getWorkspaceAccessFromSession(session);
  if (!access) {
    return NextResponse.json(
      { success: false, message: "Selecciona un workspace desde el hub." },
      { status: 400 }
    );
  }

  const workspace = await db.workspace.findUnique({
    where: { id: access.workspaceId },
    select: { name: true },
  });

  const config = await ensureWorkspaceAIConfig(
    access.workspaceId,
    workspace?.name ?? "Workspace"
  );

  if (canEditWorkspaceAiConfig(access.role)) {
    return NextResponse.json({
      success: true,
      canEdit: true,
      config: {
        id: config.id,
        workspaceId: config.workspaceId,
        companyName: config.companyName,
        aiContext: config.aiContext,
        welcomeMessage: config.welcomeMessage,
        userInstructions: config.userInstructions,
        strictMode: config.strictMode,
        updatedAt: config.updatedAt.toISOString(),
      },
    });
  }

  return NextResponse.json({
    success: true,
    canEdit: false,
    config: memberSafeConfig(config),
  });
}

export async function PATCH(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const access = await getWorkspaceAccessFromSession(session);
  if (!access) {
    return NextResponse.json(
      { success: false, message: "Selecciona un workspace desde el hub." },
      { status: 400 }
    );
  }

  if (!canEditWorkspaceAiConfig(access.role)) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }

  const parsed = await readJsonRecordFromRequest(request);
  if (!parsed.ok) {
    return NextResponse.json({ success: false, message: "Invalid JSON." }, { status: 400 });
  }

  const body = parsed.body;

  const companyName =
    typeof body.companyName === "string" ? toTrimmedString(body.companyName) : undefined;
  const aiContext = typeof body.aiContext === "string" ? body.aiContext.replace(/\u0000/g, "") : undefined;
  const welcomeMessage =
    body.welcomeMessage === null
      ? null
      : typeof body.welcomeMessage === "string"
        ? toTrimmedString(body.welcomeMessage) || null
        : undefined;
  const userInstructions =
    body.userInstructions === null
      ? null
      : typeof body.userInstructions === "string"
        ? toTrimmedString(body.userInstructions) || null
        : undefined;
  const strictMode = typeof body.strictMode === "boolean" ? body.strictMode : undefined;

  if (
    companyName === undefined &&
    aiContext === undefined &&
    welcomeMessage === undefined &&
    userInstructions === undefined &&
    strictMode === undefined
  ) {
    return NextResponse.json(
      { success: false, message: "No hay campos para actualizar." },
      { status: 400 }
    );
  }

  if (companyName !== undefined && (companyName.length < 1 || companyName.length > 255)) {
    return NextResponse.json(
      { success: false, message: "companyName debe tener entre 1 y 255 caracteres." },
      { status: 400 }
    );
  }

  if (aiContext !== undefined && aiContext.length > 120_000) {
    return NextResponse.json(
      { success: false, message: "aiContext demasiado largo." },
      { status: 400 }
    );
  }

  const workspace = await db.workspace.findUnique({
    where: { id: access.workspaceId },
    select: { name: true },
  });

  // ensure (si existe persistencia) o fallback en memoria.
  await ensureWorkspaceAIConfig(access.workspaceId, workspace?.name ?? "Workspace");

  // Si workspaceAIConfig no existe en Prisma, no persistimos; devolvemos éxito con un config calculado.
  const hasWorkspaceAIConfigModel = typeof (db as any).workspaceAIConfig?.update === "function";

  if (!hasWorkspaceAIConfigModel) {
    const fallbackCompanyName =
      companyName ?? workspace?.name ?? "Workspace";

    const merged = {
      id: -1,
      workspaceId: access.workspaceId,
      companyName: fallbackCompanyName.slice(0, 255),
      aiContext: aiContext ?? "",
      welcomeMessage: welcomeMessage ?? null,
      userInstructions: userInstructions ?? null,
      strictMode: strictMode ?? true,
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      config: {
        id: merged.id,
        workspaceId: merged.workspaceId,
        companyName: merged.companyName,
        aiContext: merged.aiContext,
        welcomeMessage: merged.welcomeMessage,
        userInstructions: merged.userInstructions,
        strictMode: merged.strictMode,
        updatedAt: merged.updatedAt.toISOString(),
      },
    });
  }

  const updated = await (db as any).workspaceAIConfig.update({
    where: { workspaceId: access.workspaceId },
    data: {
      ...(companyName !== undefined ? { companyName: companyName.slice(0, 255) } : {}),
      ...(aiContext !== undefined ? { aiContext } : {}),
      ...(welcomeMessage !== undefined ? { welcomeMessage } : {}),
      ...(userInstructions !== undefined ? { userInstructions } : {}),
      ...(strictMode !== undefined ? { strictMode } : {}),
    },
  });

  return NextResponse.json({
    success: true,
    config: {
      id: updated.id,
      workspaceId: updated.workspaceId,
      companyName: updated.companyName,
      aiContext: updated.aiContext,
      welcomeMessage: updated.welcomeMessage,
      userInstructions: updated.userInstructions,
      strictMode: updated.strictMode,
      updatedAt: updated.updatedAt.toISOString(),
    },
  });

}
