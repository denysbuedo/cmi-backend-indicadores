/*
  Warnings:

  - The `status` column on the `IndicatorValue` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[tenantId,code]` on the table `Indicator` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[indicatorId,sourceId,role]` on the table `IndicatorSource` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,code]` on the table `IndicatorType` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,code]` on the table `Objective` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,code]` on the table `Process` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tenantId` to the `Indicator` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `IndicatorType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `IndicatorValue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Objective` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Process` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Source` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "IndicatorStatus" AS ENUM ('OK', 'WARNING', 'CRITICAL');

-- DropIndex
DROP INDEX "Indicator_code_key";

-- DropIndex
DROP INDEX "IndicatorType_code_key";

-- DropIndex
DROP INDEX "Objective_code_key";

-- DropIndex
DROP INDEX "Process_code_key";

-- AlterTable
ALTER TABLE "Indicator" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "IndicatorType" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "IndicatorValue" ADD COLUMN     "target" DECIMAL(65,30),
ADD COLUMN     "tenantId" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "IndicatorStatus" NOT NULL DEFAULT 'OK';

-- AlterTable
ALTER TABLE "Objective" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Process" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Source" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_code_key" ON "Tenant"("code");

-- CreateIndex
CREATE INDEX "Indicator_tenantId_idx" ON "Indicator"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Indicator_tenantId_code_key" ON "Indicator"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "IndicatorSource_indicatorId_sourceId_role_key" ON "IndicatorSource"("indicatorId", "sourceId", "role");

-- CreateIndex
CREATE INDEX "IndicatorType_tenantId_idx" ON "IndicatorType"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "IndicatorType_tenantId_code_key" ON "IndicatorType"("tenantId", "code");

-- CreateIndex
CREATE INDEX "IndicatorValue_tenantId_idx" ON "IndicatorValue"("tenantId");

-- CreateIndex
CREATE INDEX "Objective_tenantId_idx" ON "Objective"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Objective_tenantId_code_key" ON "Objective"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Process_tenantId_idx" ON "Process"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Process_tenantId_code_key" ON "Process"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Source_tenantId_idx" ON "Source"("tenantId");

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorType" ADD CONSTRAINT "IndicatorType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Process" ADD CONSTRAINT "Process_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Indicator" ADD CONSTRAINT "Indicator_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorValue" ADD CONSTRAINT "IndicatorValue_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
