-- CreateTable
CREATE TABLE "DailyCheckin" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "completedToday" TEXT NOT NULL,
    "studiedToday" TEXT NOT NULL,
    "productProduced" TEXT NOT NULL,
    "whatWasUnclear" TEXT NOT NULL,
    "anyBlocks" TEXT NOT NULL,
    "needsHelp" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyCheckin_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DailyCheckin" ADD CONSTRAINT "DailyCheckin_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
