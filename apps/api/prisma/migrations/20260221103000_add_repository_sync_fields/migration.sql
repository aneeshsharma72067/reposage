ALTER TABLE "repositories"
ADD COLUMN "private" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "default_branch" TEXT,
ADD COLUMN "owner_login" TEXT NOT NULL DEFAULT '',
ADD COLUMN "owner_type" TEXT NOT NULL DEFAULT '';

ALTER TABLE "repositories"
ALTER COLUMN "owner_login"
DROP DEFAULT,
ALTER COLUMN "owner_type"
DROP DEFAULT;