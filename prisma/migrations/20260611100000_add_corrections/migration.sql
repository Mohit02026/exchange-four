-- Phase 18: Correction Handling

CREATE TYPE "CorrectionSeverity" AS ENUM ('MINOR', 'MODERATE', 'SERIOUS', 'CRITICAL');
CREATE TYPE "CorrectionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED');
CREATE TYPE "CorrectionAction" AS ENUM ('TRAINING_ONLY', 'VERBAL_WARNING', 'WRITTEN_WARNING', 'FINAL_WARNING', 'SUSPENSION', 'TERMINATION_RECOMMENDATION', 'TRANSFER_DEMOTION_PROMOTION');

CREATE TABLE "CorrectionHandling" (
  "id"                        TEXT NOT NULL PRIMARY KEY,
  "employeeId"                TEXT NOT NULL,
  "submittedById"             TEXT NOT NULL,
  "incident"                  TEXT NOT NULL,
  "policyInvolved"            TEXT,
  "correctionRequested"       TEXT NOT NULL,
  "trainingAssigned"          TEXT,
  "employeeResponse"          TEXT,
  "hrNotes"                   TEXT,
  "severity"                  "CorrectionSeverity" NOT NULL DEFAULT 'MINOR',
  "action"                    "CorrectionAction",
  "followUpDate"              TIMESTAMP(3),
  "resolution"                TEXT,
  "status"                    "CorrectionStatus" NOT NULL DEFAULT 'OPEN',
  "requiresExecutiveApproval" BOOLEAN NOT NULL DEFAULT false,
  "executiveDecision"         TEXT,
  "executiveDecidedAt"        TIMESTAMP(3),
  "executiveToken"            TEXT UNIQUE,
  "executiveTokenUsed"        BOOLEAN NOT NULL DEFAULT false,
  "createdAt"                 TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt"                 TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "CorrectionHandling_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id"),
  CONSTRAINT "CorrectionHandling_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id")
);
