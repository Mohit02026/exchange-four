ALTER TABLE "Applicant" ADD COLUMN IF NOT EXISTS "ghlContactId" TEXT;

CREATE TABLE IF NOT EXISTS "AppSettings" (
  "id" TEXT NOT NULL DEFAULT 'singleton',
  "emailProvider" TEXT NOT NULL DEFAULT 'resend',
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "AppSettings" ("id", "emailProvider", "updatedAt")
VALUES ('singleton', 'resend', NOW())
ON CONFLICT ("id") DO NOTHING;
