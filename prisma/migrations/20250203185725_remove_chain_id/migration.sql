/*
  Warnings:

  - You are about to drop the column `chainId` on the `Quest` table. All the data in the column will be lost.
  - You are about to drop the column `chainId` on the `Task` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Quest_chainId_idx";

-- DropIndex
DROP INDEX "Task_chainId_idx";

-- AlterTable
ALTER TABLE "Quest" DROP COLUMN "chainId";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "chainId";
