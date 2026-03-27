-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'TENANT_ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "TenantRole" AS ENUM ('ADMIN', 'VIEWER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTenant" (
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "role" "TenantRole" NOT NULL,

    CONSTRAINT "UserTenant_pkey" PRIMARY KEY ("userId","tenantId")
);

-- CreateTable
CREATE TABLE "UserProcess" (
    "userId" TEXT NOT NULL,
    "processId" TEXT NOT NULL,

    CONSTRAINT "UserProcess_pkey" PRIMARY KEY ("userId","processId")
);

-- CreateTable
CREATE TABLE "UserObjective" (
    "userId" TEXT NOT NULL,
    "objectiveId" TEXT NOT NULL,

    CONSTRAINT "UserObjective_pkey" PRIMARY KEY ("userId","objectiveId")
);

-- CreateTable
CREATE TABLE "UserIndicator" (
    "userId" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,

    CONSTRAINT "UserIndicator_pkey" PRIMARY KEY ("userId","indicatorId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "UserTenant_userId_idx" ON "UserTenant"("userId");

-- CreateIndex
CREATE INDEX "UserTenant_tenantId_idx" ON "UserTenant"("tenantId");

-- CreateIndex
CREATE INDEX "UserProcess_userId_idx" ON "UserProcess"("userId");

-- CreateIndex
CREATE INDEX "UserProcess_processId_idx" ON "UserProcess"("processId");

-- CreateIndex
CREATE INDEX "UserObjective_userId_idx" ON "UserObjective"("userId");

-- CreateIndex
CREATE INDEX "UserObjective_objectiveId_idx" ON "UserObjective"("objectiveId");

-- CreateIndex
CREATE INDEX "UserIndicator_userId_idx" ON "UserIndicator"("userId");

-- CreateIndex
CREATE INDEX "UserIndicator_indicatorId_idx" ON "UserIndicator"("indicatorId");

-- AddForeignKey
ALTER TABLE "UserTenant" ADD CONSTRAINT "UserTenant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTenant" ADD CONSTRAINT "UserTenant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProcess" ADD CONSTRAINT "UserProcess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProcess" ADD CONSTRAINT "UserProcess_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserObjective" ADD CONSTRAINT "UserObjective_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserObjective" ADD CONSTRAINT "UserObjective_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserIndicator" ADD CONSTRAINT "UserIndicator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserIndicator" ADD CONSTRAINT "UserIndicator_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "Indicator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
