-- Phase 19: Offboarding

CREATE TYPE "OffboardingReason" AS ENUM ('VOLUNTARY', 'TERMINATION', 'REDUNDANCY', 'TRANSFER');
CREATE TYPE "OffboardingStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETE');
CREATE TYPE "OffboardingOwner" AS ENUM ('HR', 'SENIOR', 'IT', 'ADMIN', 'TREASURY', 'SECURITY');

CREATE TABLE "OffboardingCase" (
  "id"                    TEXT NOT NULL PRIMARY KEY,
  "employeeId"            TEXT NOT NULL UNIQUE,
  "reason"                "OffboardingReason" NOT NULL,
  "finalDay"              TIMESTAMP(3),
  "requiresCeoApproval"   BOOLEAN NOT NULL DEFAULT false,
  "ceoApprovalToken"      TEXT UNIQUE,
  "ceoApprovalTokenUsed"  BOOLEAN NOT NULL DEFAULT false,
  "ceoApproved"           BOOLEAN,
  "ceoDecidedAt"          TIMESTAMP(3),
  "status"                "OffboardingStatus" NOT NULL DEFAULT 'OPEN',
  "exitSummary"           TEXT,
  "createdById"           TEXT NOT NULL,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "OffboardingCase_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id"),
  CONSTRAINT "OffboardingCase_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id")
);

CREATE TABLE "OffboardingChecklistItem" (
  "id"            TEXT NOT NULL PRIMARY KEY,
  "caseId"        TEXT NOT NULL,
  "owner"         "OffboardingOwner" NOT NULL,
  "item"          TEXT NOT NULL,
  "completedAt"   TIMESTAMP(3),
  "completedById" TEXT,
  "notes"         TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "OffboardingChecklistItem_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "OffboardingCase"("id"),
  CONSTRAINT "OffboardingChecklistItem_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id")
);
