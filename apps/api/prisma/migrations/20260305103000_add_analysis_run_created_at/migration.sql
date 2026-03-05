-- Add row creation timestamp to analysis runs
ALTER TABLE "analysis_runs"
ADD COLUMN "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;