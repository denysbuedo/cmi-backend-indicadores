-- AlterTable
-- Add subdomain column with default value based on code
ALTER TABLE "Tenant" ADD COLUMN "subdomain" TEXT;

-- Set default subdomain for existing tenants (lowercase code)
UPDATE "Tenant" SET "subdomain" = LOWER("code") WHERE "subdomain" IS NULL;

-- Make subdomain NOT NULL
ALTER TABLE "Tenant" ALTER COLUMN "subdomain" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_subdomain_key" ON "Tenant"("subdomain");
