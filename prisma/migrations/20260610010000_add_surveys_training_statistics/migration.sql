-- Phase 13: NewHireSurvey
CREATE TABLE "NewHireSurvey" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "q1" TEXT NOT NULL,
    "q2" TEXT NOT NULL,
    "q3" TEXT NOT NULL,
    "q4" TEXT NOT NULL,
    "q5" TEXT NOT NULL,
    "q6" TEXT NOT NULL,
    "q7" TEXT,
    "q8" TEXT,
    "ratingScore" INTEGER,
    "handlingNeeded" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NewHireSurvey_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "NewHireSurvey" ADD CONSTRAINT "NewHireSurvey_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Phase 14: TrainingPlan, TrainingTask, HatPack
CREATE TABLE "TrainingPlan" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "postTitle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrainingPlan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TrainingPlan_employeeId_key" ON "TrainingPlan"("employeeId");
ALTER TABLE "TrainingPlan" ADD CONSTRAINT "TrainingPlan_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "TrainingTask" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "functionName" TEXT NOT NULL,
    "policyRef" TEXT,
    "trainerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "dateStarted" TIMESTAMP(3),
    "datePassed" TIMESTAMP(3),
    "qualityCheckNotes" TEXT,
    "correctionNotes" TEXT,
    "evidenceFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrainingTask_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "TrainingTask" ADD CONSTRAINT "TrainingTask_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TrainingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "HatPack" (
    "id" TEXT NOT NULL,
    "postTitle" TEXT NOT NULL,
    "functions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HatPack_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "HatPack_postTitle_key" ON "HatPack"("postTitle");

-- Phase 15: Statistic, StatisticEntry
CREATE TABLE "Statistic" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "postTitle" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "target" DOUBLE PRECISION,
    "seniorResponsible" TEXT,
    "dataSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Statistic_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Statistic" ADD CONSTRAINT "Statistic_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "StatisticEntry" (
    "id" TEXT NOT NULL,
    "statisticId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "period" TEXT NOT NULL,
    "enteredById" TEXT,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StatisticEntry_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "StatisticEntry" ADD CONSTRAINT "StatisticEntry_statisticId_fkey" FOREIGN KEY ("statisticId") REFERENCES "Statistic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
