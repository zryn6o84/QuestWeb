"use client";

import { useCreateQuestMutation } from "@/hooks/useQuestData";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import QuestForm from "@/components/QuestForm";
import { Suspense } from "react";

function CreateQuestPageInner() {
  const createQuest = useCreateQuestMutation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/quests" className="text-primary hover:text-primary/80">
            <ArrowLeft className="inline-block mr-2" />
            Back to Quests
          </Link>
          <h1 className="text-2xl font-bold glow-text">
            Create New Quest
          </h1>
        </div>

        <QuestForm
          onSubmit={createQuest.mutateAsync}
          mode="create"
        />
      </div>
    </div>
  );
}

export default function CreateQuestPage() {
  return (
    <Suspense fallback={null}>
      <CreateQuestPageInner />
    </Suspense>
  );
}