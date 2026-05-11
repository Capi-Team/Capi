import { ChatMessageRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { readJsonRecordFromRequest } from "@/lib/http/json";
import { toTrimmedString } from "@/lib/strings/coerce";
import { buildSystemPrompt } from "@/lib/workspace-ai/build-system-prompt";
import { completeChat } from "@/lib/workspace-ai/ollama-chat";
import { ensureWorkspaceAIConfig } from "@/lib/workspace-ai/ensure-ai-config";
import { getWorkspaceAccessFromSession } from "@/lib/workspace-ai/workspace-access";
import {
  sanitizeUserMessage,
  wrapUserMessageForModel,
} from "@/lib/workspace-ai/sanitize-user-message";

const HISTORY_LIMIT = 36;

export async function POST(request: Request) {
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

  const parsed = await readJsonRecordFromRequest(request);
  if (!parsed.ok) {
    return NextResponse.json({ success: false, message: "Invalid JSON." }, { status: 400 });
  }

  const rawMessage = toTrimmedString(parsed.body.message);
  if (!rawMessage) {
    return NextResponse.json({ success: false, message: "Mensaje vacío." }, { status: 400 });
  }

  const { text: sanitized, wasTrimmed } = sanitizeUserMessage(rawMessage);
  if (!sanitized) {
    return NextResponse.json({ success: false, message: "Mensaje inválido." }, { status: 400 });
  }

  const conversationIdRaw = parsed.body.conversationId;
  const conversationId =
    typeof conversationIdRaw === "number"
      ? conversationIdRaw
      : typeof conversationIdRaw === "string"
        ? Number.parseInt(conversationIdRaw, 10)
        : undefined;

  const workspace = await db.workspace.findUnique({
    where: { id: access.workspaceId },
    select: { name: true },
  });

  const aiConfig = await ensureWorkspaceAIConfig(
    access.workspaceId,
    workspace?.name ?? "Workspace"
  );

  let conversation =
    conversationId !== undefined && Number.isFinite(conversationId)
      ? await db.conversation.findFirst({
          where: {
            id: conversationId,
            userId: access.userId,
            workspaceId: access.workspaceId,
          },
        })
      : null;

  if (conversationId !== undefined && Number.isFinite(conversationId) && !conversation) {
    return NextResponse.json(
      { success: false, message: "Conversación no encontrada." },
      { status: 404 }
    );
  }

  if (!conversation) {
    const title = sanitized.slice(0, 80);
    conversation = await db.conversation.create({
      data: {
        userId: access.userId,
        workspaceId: access.workspaceId,
        title,
      },
    });
  }

  const systemPrompt = buildSystemPrompt(aiConfig);

  const prior = await db.chatMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: HISTORY_LIMIT,
  });

  const history = prior.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  await db.chatMessage.create({
    data: {
      conversationId: conversation.id,
      role: ChatMessageRole.USER,
      content: sanitized,
    },
  });

  const wrappedUser = wrapUserMessageForModel(sanitized);

  const result = await completeChat({
    systemPrompt,
    history,
    userMessage: wrappedUser,
  });

  const fallbackReply = [
    "I couldn't reach the local AI model right now, so here's a quick guidance fallback.",
    "",
    `Your question: "${sanitized}"`,
    "",
    "Try this:",
    "1) Ensure Ollama is running on http://localhost:11434.",
    "2) Verify a model is available (e.g. llama3:8b).",
    "3) Retry your message in a few seconds.",
    "",
    "If you want, I can still help based on your workspace instructions while the model is offline.",
  ].join("\n");

  if (!result.ok) {
    await db.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: ChatMessageRole.ASSISTANT,
        content: fallbackReply,
      },
    });

    await db.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    const messages = await db.chatMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      reply: fallbackReply,
      usedFallback: true,
      fallbackReason: result.error,
      messageWasTruncated: wasTrimmed,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  }

  await db.chatMessage.create({
    data: {
      conversationId: conversation.id,
      role: ChatMessageRole.ASSISTANT,
      content: result.content,
    },
  });

  await db.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  const messages = await db.chatMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return NextResponse.json({
    success: true,
    conversationId: conversation.id,
    reply: result.content,
    messageWasTruncated: wasTrimmed,
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}
