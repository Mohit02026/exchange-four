-- CreateEnum
CREATE TYPE "PerfReviewType" AS ENUM ('DAY_30', 'DAY_60', 'DAY_90', 'ANNUAL');

-- CreateEnum
CREATE TYPE "PerfReviewStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DisciplinaryType" AS ENUM ('VERBAL_WARNING', 'WRITTEN_WARNING', 'FINAL_WARNING', 'PERFORMANCE_IMPROVEMENT_PLAN', 'SUSPENSION', 'TERMINATION');

-- CreateEnum
CREATE TYPE "DisciplinaryStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'APPEALED', 'CLOSED', 'EXPUNGED');

-- AlterTable Employee (Phase 27: org board fields)
ALTER TABLE "Employee" ADD COLUMN "department" TEXT;
ALTER TABLE "Employee" ADD COLUMN "managerId" TEXT;

-- AlterTable OnboardingPlan (Phase 22: document keys)
ALTER TABLE "OnboardingPlan" ADD COLUMN "ndaDocumentKey" TEXT;
ALTER TABLE "OnboardingPlan" ADD COLUMN "contractDocumentKey" TEXT;
ALTER TABLE "OnboardingPlan" ADD COLUMN "policiesDocumentKey" TEXT;

-- AddForeignKey Employee self-reference (manager)
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable PerformanceReview (Phase 26)
CREATE TABLE "PerformanceReview" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "PerfReviewType" NOT NULL,
    "status" "PerfReviewStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "conductedAt" TIMESTAMP(3),
    "conductedById" TEXT,
    "ratings" JSONB,
    "summary" TEXT,
    "goalsSet" TEXT,
    "employeeComments" TEXT,
    "documentKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PerformanceReview_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey PerformanceReview → Employee
ALTER TABLE "PerformanceReview" ADD CONSTRAINT "PerformanceReview_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable DisciplinaryAction (Phase 29)
CREATE TABLE "DisciplinaryAction" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "DisciplinaryType" NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "incidentDescription" TEXT NOT NULL,
    "actionTaken" TEXT NOT NULL,
    "outcome" TEXT,
    "witnessName" TEXT,
    "status" "DisciplinaryStatus" NOT NULL DEFAULT 'OPEN',
    "appealedAt" TIMESTAMP(3),
    "appealNotes" TEXT,
    "appealOutcome" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "employeeAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "employeeAcknowledgedAt" TIMESTAMP(3),
    "documentKey" TEXT,
    "appealToken" TEXT,
    "appealTokenUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DisciplinaryAction_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex DisciplinaryAction.appealToken
CREATE UNIQUE INDEX "DisciplinaryAction_appealToken_key" ON "DisciplinaryAction"("appealToken");

-- AddForeignKey DisciplinaryAction → Employee
ALTER TABLE "DisciplinaryAction" ADD CONSTRAINT "DisciplinaryAction_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
