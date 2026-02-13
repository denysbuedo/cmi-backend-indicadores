-- CreateEnum
CREATE TYPE "SourceRole" AS ENUM ('DATA', 'NUMERATOR', 'DENOMINATOR');

-- AlterTable
ALTER TABLE "Indicator" ADD COLUMN     "frequencyDays" INTEGER,
ADD COLUMN     "frequencyMonths" INTEGER;

-- CreateTable
CREATE TABLE "IndicatorSource" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "role" "SourceRole" NOT NULL DEFAULT 'DATA',

    CONSTRAINT "IndicatorSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndicatorValue" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OK',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndicatorValue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "IndicatorSource" ADD CONSTRAINT "IndicatorSource_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "Indicator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorSource" ADD CONSTRAINT "IndicatorSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorValue" ADD CONSTRAINT "IndicatorValue_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "Indicator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
