import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { readJsonRecordFromRequest } from "@/lib/http/json";
import { toTrimmedString } from "@/lib/strings/coerce";
import { getWorkspaceAccessFromSession } from "@/lib/workspace-ai/workspace-access";

const VALID_TYPES = new Set(["LINK", "VIDEO", "IMAGE", "DOCUMENT", "OTHER"]);

function parseUrl(value: unknown): string | null {
  const url = toTrimmedString(value);
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) return null;
  return url.slice(0, 2048);
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const access = await getWorkspaceAccessFromSession(session);
  if (!access) {
    return NextResponse.json(
      { success: false, message: "Select a workspace from the hub." },
      { status: 400 }
    );
  }

  const rows = await (db as any).workspaceResource.findMany({
    where: { workspaceId: access.workspaceId },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 200,
    include: {
      createdBy: { select: { id: true, email: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({
    success: true,
    canEdit: access.role === "OWNER" || access.role === "ADMIN",
    resources: rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      type: r.type,
      isPinned: Boolean(r.isPinned),
      description: r.description,
      createdAt: r.createdAt.toISOString(),
      createdBy: {
        id: r.createdBy.id,
        email: r.createdBy.email,
        avatarUrl: r.createdBy.avatarUrl ?? null,
      },
    })),
  });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const access = await getWorkspaceAccessFromSession(session);
  if (!access) {
    return NextResponse.json(
      { success: false, message: "Select a workspace from the hub." },
      { status: 400 }
    );
  }
  if (access.role !== "OWNER" && access.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, message: "Only owner/admin can publish resources." },
      { status: 403 }
    );
  }

  const parsed = await readJsonRecordFromRequest(request);
  if (!parsed.ok) {
    return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
  }

  const title = toTrimmedString(parsed.body.title)?.slice(0, 255);
  const url = parseUrl(parsed.body.url);
  const typeRaw = toTrimmedString(parsed.body.type)?.toUpperCase() ?? "LINK";
  const type = VALID_TYPES.has(typeRaw) ? typeRaw : "LINK";
  const description = toTrimmedString(parsed.body.description)?.slice(0, 2000) ?? null;

  if (!title || !url) {
    return NextResponse.json(
      { success: false, message: "Title and a valid URL are required." },
      { status: 400 }
    );
  }

  const created = await (db as any).workspaceResource.create({
    data: {
      workspaceId: access.workspaceId,
      createdById: access.userId,
      title,
      url,
      type,
      description,
    },
  });

  return NextResponse.json({ success: true, id: created.id });
}
