-- CreateEnum
CREATE TYPE "EvaluationDirection" AS ENUM ('HIGHER_IS_BETTER', 'LOWER_IS_BETTER');

-- AlterTable
ALTER TABLE "Indicator" ADD COLUMN     "evaluationDirection" "EvaluationDirection" NOT NULL DEFAULT 'HIGHER_IS_BETTER';
