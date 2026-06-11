CREATE TYPE "EthicsSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'SENSITIVE');
CREATE TYPE "EthicsStatus" AS ENUM ('OPEN', 'UNDER_INVESTIGATION', 'CLOSED', 'FILED');

CREATE TABLE "EthicsReport" (
  "id" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "subjectEmployeeId" TEXT,
  "subjectApplicantId" TEXT,
  "subjectType" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "evidenceUrl" TEXT,
  "witnesses" TEXT,
  "severity" "EthicsSeverity" NOT NULL DEFAULT 'LOW',
  "isSensitive" BOOLEAN NOT NULL DEFAULT false,
  "triageNotes" TEXT,
  "assignedHandlerId" TEXT,
  "status" "EthicsStatus" NOT NULL DEFAULT 'OPEN',
  "outcome" TEXT,
  "fileDestination" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EthicsReport_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EthicsReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "EthicsReport_subjectEmployeeId_fkey" FOREIGN KEY ("subjectEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "EthicsReport_subjectApplicantId_fkey" FOREIGN KEY ("subjectApplicantId") REFERENCES "Applicant"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "EthicsReport_assignedHandlerId_fkey" FOREIGN KEY ("assignedHandlerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
