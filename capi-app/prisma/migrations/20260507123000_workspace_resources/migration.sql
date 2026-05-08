CREATE TYPE "WorkspaceResourceType" AS ENUM ('LINK', 'VIDEO', 'IMAGE', 'DOCUMENT', 'OTHER');

CREATE TABLE "workspace_resources" (
  "id" SERIAL NOT NULL,
  "workspace_id" INTEGER NOT NULL,
  "created_by_id" INTEGER NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "url" TEXT NOT NULL,
  "type" "WorkspaceResourceType" NOT NULL DEFAULT 'LINK',
  "description" TEXT,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "workspace_resources_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "workspace_resources_workspace_id_created_at_idx"
ON "workspace_resources"("workspace_id", "created_at");

ALTER TABLE "workspace_resources"
ADD CONSTRAINT "workspace_resources_workspace_id_fkey"
FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id")
ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "workspace_resources"
ADD CONSTRAINT "workspace_resources_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE NO ACTION;
