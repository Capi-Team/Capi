ALTER TABLE "users"
ADD COLUMN "profile_bio" TEXT,
ADD COLUMN "avatar_url" TEXT;

ALTER TABLE "workspaces"
ADD COLUMN "image_url" TEXT;
