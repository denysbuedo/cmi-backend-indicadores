-- AlterTable
ALTER TABLE "Indicator" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Objective" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Process" ADD COLUMN     "deletedAt" TIMESTAMP(3);
