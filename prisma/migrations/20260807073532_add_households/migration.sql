-- CreateEnum
CREATE TYPE "HouseholdRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Family',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdMembership" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "role" "HouseholdRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HouseholdMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdInvite" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" "HouseholdRole" NOT NULL DEFAULT 'MEMBER',
    "createdById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "usedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HouseholdInvite_pkey" PRIMARY KEY ("id")
);

-- AlterTable: added NULLABLE first — real Baby rows already exist in
-- production, so a straight NOT NULL add would fail. Backfilled below,
-- then enforced NOT NULL at the end of this migration.
ALTER TABLE "Baby" ADD COLUMN "householdId" TEXT;

-- CreateIndex
CREATE INDEX "HouseholdMembership_caregiverId_idx" ON "HouseholdMembership"("caregiverId");

-- CreateIndex
CREATE UNIQUE INDEX "HouseholdMembership_householdId_caregiverId_key" ON "HouseholdMembership"("householdId", "caregiverId");

-- CreateIndex
CREATE UNIQUE INDEX "HouseholdInvite_token_key" ON "HouseholdInvite"("token");

-- CreateIndex
CREATE INDEX "HouseholdInvite_householdId_idx" ON "HouseholdInvite"("householdId");

-- CreateIndex
CREATE INDEX "HouseholdInvite_token_idx" ON "HouseholdInvite"("token");

-- CreateIndex
CREATE INDEX "Baby_householdId_idx" ON "Baby"("householdId");

-- AddForeignKey
ALTER TABLE "HouseholdMembership" ADD CONSTRAINT "HouseholdMembership_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdMembership" ADD CONSTRAINT "HouseholdMembership_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdInvite" ADD CONSTRAINT "HouseholdInvite_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdInvite" ADD CONSTRAINT "HouseholdInvite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Caregiver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdInvite" ADD CONSTRAINT "HouseholdInvite_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "Caregiver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Data backfill: every existing caregiver and baby predates the household
-- concept entirely. Put them all in one default household, and make every
-- existing caregiver OWNER of it — preserving exactly the access they have
-- today (everyone can see/manage everything) rather than silently
-- downgrading anyone to MEMBER. No-ops on a fresh database with no
-- caregivers yet.
DO $$
DECLARE
  default_household_id TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM "Caregiver") AND NOT EXISTS (SELECT 1 FROM "Household") THEN
    default_household_id := gen_random_uuid()::text;

    INSERT INTO "Household" (id, name, "createdAt", "updatedAt")
      VALUES (default_household_id, 'My Family', now(), now());

    UPDATE "Baby" SET "householdId" = default_household_id WHERE "householdId" IS NULL;

    INSERT INTO "HouseholdMembership" (id, "householdId", "caregiverId", role, "createdAt")
      SELECT gen_random_uuid()::text, default_household_id, "id", 'OWNER', now()
      FROM "Caregiver";
  END IF;
END $$;

-- Now safe to enforce: every existing row was backfilled above, and any
-- new Baby row going forward is created with a householdId by the app.
ALTER TABLE "Baby" ALTER COLUMN "householdId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Baby" ADD CONSTRAINT "Baby_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
