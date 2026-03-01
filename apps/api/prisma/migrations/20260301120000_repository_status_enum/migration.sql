-- Create enum for repository lifecycle status
CREATE TYPE "RepositoryStatus" AS ENUM ('IDLE', 'ANALYZING', 'HEALTHY', 'ISSUES_FOUND');

-- Safely migrate existing string status values to enum values
ALTER TABLE "repositories"
ADD COLUMN "status_new" "RepositoryStatus" NOT NULL DEFAULT 'IDLE';

UPDATE "repositories"
SET
    "status_new" = CASE LOWER(COALESCE("status", ''))
        WHEN 'idle' THEN 'IDLE'::"RepositoryStatus"
        WHEN 'analyzing' THEN 'ANALYZING'::"RepositoryStatus"
        WHEN 'healthy' THEN 'HEALTHY'::"RepositoryStatus"
        WHEN 'issues_found' THEN 'ISSUES_FOUND'::"RepositoryStatus"
        ELSE 'IDLE'::"RepositoryStatus"
    END;

ALTER TABLE "repositories" DROP COLUMN "status";

ALTER TABLE "repositories" RENAME COLUMN "status_new" TO "status";