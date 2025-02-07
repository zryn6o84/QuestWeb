"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuests } from "@/hooks/useQuestData";
import QuestList from "@/components/QuestList";
import BoardsPageSkeleton from "@/components/BoardsPageSkeleton";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Suspense } from "react";
import Link from "next/link";
import { Quest } from "@/types/quest";

const ITEMS_PER_PAGE = 9; // 3x3 grid

interface QuestResponse {
  quests: Quest[];
  total: number;
  totalPages: number;
}

function BoardsPageInner() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useQuests(currentPage);
  const questData = data || { quests: [], total: 0, totalPages: 0 };

  if (isLoading) {
    return <BoardsPageSkeleton />;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gradient">
          Explore Quests
        </h1>
        {session?.user && (
          <Link href="/quests/create">
            <Button
              className="w-full sm:w-auto bg-primary/20 text-foreground hover:bg-primary/30 backdrop-blur-sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Quest
            </Button>
          </Link>
        )}
      </div>

      <QuestList
        quests={questData.quests}
        currentPage={currentPage}
        totalPages={questData.totalPages}
        onPageChange={setCurrentPage}
        isLoading={isLoading}
      />
    </div>
  );
}

export default function BoardsPage() {
  return (
    <Suspense fallback={null}>
      <BoardsPageInner />
    </Suspense>
  );
}