-- AlterTable
ALTER TABLE "repositories" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'idle',
ALTER COLUMN "private" DROP DEFAULT;
