/*
  Warnings:

  - Added the required column `createdBy` to the `Quest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Quest" ADD COLUMN     "createdBy" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "TaskReviewer" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskReviewer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskReviewer_taskId_idx" ON "TaskReviewer"("taskId");

-- CreateIndex
CREATE INDEX "TaskReviewer_userId_idx" ON "TaskReviewer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskReviewer_taskId_userId_key" ON "TaskReviewer"("taskId", "userId");

-- AddForeignKey
ALTER TABLE "TaskReviewer" ADD CONSTRAINT "TaskReviewer_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskReviewer" ADD CONSTRAINT "TaskReviewer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
