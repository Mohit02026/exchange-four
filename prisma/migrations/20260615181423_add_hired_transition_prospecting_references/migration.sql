-- Phase 21: OnboardingPlan acknowledgment timestamps
ALTER TABLE "OnboardingPlan"
  ADD COLUMN IF NOT EXISTS "ndaSignedAt"      TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "contractSignedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "policiesReadAt"   TIMESTAMP(3);

-- Phase 23: Prospecting enums + table
CREATE TYPE "ProspectSource" AS ENUM ('MANUAL', 'LINKEDIN', 'REFERRAL', 'EVENT');
CREATE TYPE "ProspectStatus" AS ENUM ('IDENTIFIED', 'CONTACTED', 'INVITE_SENT', 'APPLIED', 'NOT_INTERESTED', 'ARCHIVED');

CREATE TABLE IF NOT EXISTS "Prospect" (
    "id"            TEXT NOT NULL,
    "firstName"     TEXT NOT NULL,
    "lastName"      TEXT NOT NULL,
    "email"         TEXT,
    "phone"         TEXT,
    "linkedinUrl"   TEXT,
    "source"        "ProspectSource" NOT NULL DEFAULT 'MANUAL',
    "notes"         TEXT,
    "positionId"    TEXT,
    "status"        "ProspectStatus" NOT NULL DEFAULT 'IDENTIFIED',
    "inviteSentAt"  TIMESTAMP(3),
    "appliedAt"     TIMESTAMP(3),
    "applicationId" TEXT,
    "createdBy"     TEXT NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Prospect_email_key" ON "Prospect"("email");

ALTER TABLE "Prospect"
  ADD CONSTRAINT "Prospect_positionId_fkey"
  FOREIGN KEY ("positionId") REFERENCES "Position"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  NOT VALID;

-- Phase 28: Reference & Background Check enums + tables
CREATE TYPE "ReferenceStatus" AS ENUM ('PENDING', 'REQUESTED', 'COMPLETED', 'UNREACHABLE', 'DECLINED');
CREATE TYPE "BGCheckStatus"   AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED');
CREATE TYPE "BGCheckResult"   AS ENUM ('CLEAR', 'CONSIDER', 'FAILED');

CREATE TABLE IF NOT EXISTS "ReferenceCheck" (
    "id"             TEXT NOT NULL,
    "applicationId"  TEXT NOT NULL,
    "refereeName"    TEXT NOT NULL,
    "refereeTitle"   TEXT,
    "refereeCompany" TEXT,
    "refereeEmail"   TEXT NOT NULL,
    "refereePhone"   TEXT,
    "relationship"   TEXT NOT NULL,
    "status"         "ReferenceStatus" NOT NULL DEFAULT 'PENDING',
    "requestSentAt"  TIMESTAMP(3),
    "completedAt"    TIMESTAMP(3),
    "rating"         INTEGER,
    "notes"          TEXT,
    "wouldRehire"    BOOLEAN,
    "token"          TEXT,
    "tokenExpiry"    TIMESTAMP(3),
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReferenceCheck_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ReferenceCheck_token_key" ON "ReferenceCheck"("token");

ALTER TABLE "ReferenceCheck"
  ADD CONSTRAINT "ReferenceCheck_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE
  NOT VALID;

CREATE TABLE IF NOT EXISTS "BackgroundCheck" (
    "id"              TEXT NOT NULL,
    "applicationId"   TEXT NOT NULL,
    "status"          "BGCheckStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "provider"        TEXT,
    "referenceNumber" TEXT,
    "completedAt"     TIMESTAMP(3),
    "result"          "BGCheckResult",
    "notes"           TEXT,
    "documentKey"     TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BackgroundCheck_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BackgroundCheck_applicationId_key" ON "BackgroundCheck"("applicationId");

ALTER TABLE "BackgroundCheck"
  ADD CONSTRAINT "BackgroundCheck_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE
  NOT VALID;
