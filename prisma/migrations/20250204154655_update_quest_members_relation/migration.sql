/*
  Warnings:

  - You are about to drop the `_QuestToUserProfile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_QuestToUserProfile" DROP CONSTRAINT "_QuestToUserProfile_A_fkey";

-- DropForeignKey
ALTER TABLE "_QuestToUserProfile" DROP CONSTRAINT "_QuestToUserProfile_B_fkey";

-- DropTable
DROP TABLE "_QuestToUserProfile";

-- CreateTable
CREATE TABLE "_QuestMembers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_QuestMembers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_QuestMembers_B_index" ON "_QuestMembers"("B");

-- AddForeignKey
ALTER TABLE "_QuestMembers" ADD CONSTRAINT "_QuestMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QuestMembers" ADD CONSTRAINT "_QuestMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
