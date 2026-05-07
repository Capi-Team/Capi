-- Enums para mensajes de chat
CREATE TYPE "ChatMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- Configuración de IA por workspace
CREATE TABLE "workspace_ai_configs" (
    "id" SERIAL NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "company_name" VARCHAR(255) NOT NULL,
    "ai_context" TEXT NOT NULL,
    "welcome_message" TEXT,
    "user_instructions" TEXT,
    "strict_mode" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_ai_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workspace_ai_configs_workspace_id_key" ON "workspace_ai_configs"("workspace_id");

ALTER TABLE "workspace_ai_configs" ADD CONSTRAINT "workspace_ai_configs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Conversaciones (aisladas por usuario y workspace)
CREATE TABLE "conversations" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "title" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "conversations_user_id_workspace_id_idx" ON "conversations"("user_id", "workspace_id");

ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "conversations" ADD CONSTRAINT "conversations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Mensajes
CREATE TABLE "chat_messages" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "role" "ChatMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "chat_messages_conversation_id_idx" ON "chat_messages"("conversation_id");

ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Config por defecto para workspaces ya existentes
INSERT INTO "workspace_ai_configs" ("workspace_id", "company_name", "ai_context", "welcome_message", "strict_mode")
SELECT
  w."id",
  w."name",
  'Define aquí la documentación, procesos y políticas internas de la empresa. El administrador puede editar este contexto desde el panel del workspace.',
  NULL,
  true
FROM "workspaces" w
WHERE NOT EXISTS (
  SELECT 1 FROM "workspace_ai_configs" c WHERE c."workspace_id" = w."id"
);
