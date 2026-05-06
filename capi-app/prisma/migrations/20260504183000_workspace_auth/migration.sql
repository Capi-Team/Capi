-- Enum para roles de membresía en workspace
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- Columna updated_at en users (requerida por Prisma @updatedAt)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "users" SET "updated_at" = COALESCE("created_at", CURRENT_TIMESTAMP);

-- Quitar FKs legacy antes de borrar columnas
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_company_id_fkey";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_role_id_fkey";

ALTER TABLE "users" DROP COLUMN IF EXISTS "google_id";
ALTER TABLE "users" DROP COLUMN IF EXISTS "provider";
ALTER TABLE "users" DROP COLUMN IF EXISTS "company_id";
ALTER TABLE "users" DROP COLUMN IF EXISTS "role_id";
ALTER TABLE "users" DROP COLUMN IF EXISTS "is_approved";

CREATE TABLE "workspaces" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255),
    "invite_code" VARCHAR(32),
    "created_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");
CREATE UNIQUE INDEX "workspaces_invite_code_key" ON "workspaces"("invite_code");

CREATE TABLE "workspace_members" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "role" "WorkspaceRole" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workspace_members_user_id_workspace_id_key" ON "workspace_members"("user_id", "workspace_id");

ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
