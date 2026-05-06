import { NextRequest, NextResponse } from "next/server";
import { WorkspaceRole } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { readJsonRecordFromRequest } from "@/lib/http/json";
import { generateInviteCode } from "@/lib/workspace-code";
import { toTrimmedString } from "@/lib/strings/coerce";

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
  }

  const parsed = await readJsonRecordFromRequest(request);
  if (!parsed.ok) {
    return NextResponse.json({ success: false, message: "Solicitud inválida." }, { status: 400 });
  }

  const name = toTrimmedString(parsed.body.name);
  if (!name || name.length < 2) {
    return NextResponse.json(
      { success: false, message: "El nombre del entorno debe tener al menos 2 caracteres." },
      { status: 400 }
    );
  }

  const userId = Number.parseInt(session.sub, 10);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ success: false, message: "Sesión inválida." }, { status: 401 });
  }

  let inviteCode = generateInviteCode();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const clash = await db.workspace.findUnique({ where: { inviteCode } });
    if (!clash) break;
    inviteCode = generateInviteCode();
  }

  const workspace = await db.workspace.create({
    data: {
      name: name.slice(0, 255),
      inviteCode,
      createdById: userId,
      members: {
        create: {
          userId,
          role: WorkspaceRole.OWNER,
        },
      },
    },
    select: {
      id: true,
      name: true,
      inviteCode: true,
    },
  });

  return NextResponse.json({
    success: true,
    workspace,
  });
}
