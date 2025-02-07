/*
  Warnings:

  - You are about to drop the column `proof` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `reviewComment` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedAt` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `reviewerId` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `submittedAt` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `submitterId` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `allowSelfCheck` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `UserProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_QuestMembers` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[evmAddress]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `content` to the `Submission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Submission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creatorId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_submitterId_fkey";

-- DropForeignKey
ALTER TABLE "TaskReviewer" DROP CONSTRAINT "TaskReviewer_userId_fkey";

-- DropForeignKey
ALTER TABLE "_QuestMembers" DROP CONSTRAINT "_QuestMembers_A_fkey";

-- DropForeignKey
ALTER TABLE "_QuestMembers" DROP CONSTRAINT "_QuestMembers_B_fkey";

-- DropIndex
DROP INDEX "Submission_submitterId_idx";

-- AlterTable
ALTER TABLE "Quest" ALTER COLUMN "config" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "proof",
DROP COLUMN "reviewComment",
DROP COLUMN "reviewedAt",
DROP COLUMN "reviewerId",
DROP COLUMN "submittedAt",
DROP COLUMN "submitterId",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'pending',
ALTER COLUMN "status" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "allowSelfCheck",
ADD COLUMN     "creatorId" TEXT,
ALTER COLUMN "config" SET DATA TYPE TEXT;

-- Update existing tasks with a creator
UPDATE "Task" t
SET "creatorId" = (SELECT id FROM "User" LIMIT 1)
WHERE t."creatorId" IS NULL;

-- Make the column non-nullable
ALTER TABLE "Task" ALTER COLUMN "creatorId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password",
ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "image" TEXT,
ADD COLUMN     "name" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- DropTable
DROP TABLE "UserProfile";

-- DropTable
DROP TABLE "_QuestMembers";

-- CreateTable
CREATE TABLE "QuestMember" (
    "id" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuestMember_questId_idx" ON "QuestMember"("questId");

-- CreateIndex
CREATE INDEX "QuestMember_userId_idx" ON "QuestMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestMember_questId_userId_key" ON "QuestMember"("questId", "userId");

-- CreateIndex
CREATE INDEX "Submission_userId_idx" ON "Submission"("userId");

-- CreateIndex
CREATE INDEX "Task_creatorId_idx" ON "Task"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "User_evmAddress_key" ON "User"("evmAddress");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskReviewer" ADD CONSTRAINT "TaskReviewer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestMember" ADD CONSTRAINT "QuestMember_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestMember" ADD CONSTRAINT "QuestMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
