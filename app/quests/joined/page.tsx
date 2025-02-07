'use client';

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useGetBoardsByMember, useGetProfiles } from '@/hooks/useContract';
import BoardCard from '@/components/QuestCard';
import BoardsPageSkeleton from "@/components/BoardsPageSkeleton";
import { BoardView } from '@/types/types';
import { Quest, UserProfile } from '@/types/quest';
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAccount } from 'wagmi';
import { Suspense } from "react";

function JoinedBoardsPageInner() {
  const router = useRouter();
  const { address } = useAccount();
  const { data: boardsData = [], isLoading } = useGetBoardsByMember(address);

  // Get all creator addresses
  const creatorAddresses = useMemo(() => {
    if (!boardsData || !Array.isArray(boardsData)) return [];
    return boardsData.map((board: BoardView) => board.creator as `0x${string}`);
  }, [boardsData]);

  // Batch retrieve creator profiles
  const { data: profilesData } = useGetProfiles(creatorAddresses);

  // Convert data information into a map format
  const creatorProfiles = useMemo(() => {
    if (!profilesData || !Array.isArray(profilesData)) return {};

    const [nicknames, avatars, socialAccounts, _, __] = profilesData;
    return creatorAddresses.reduce((acc, address, index) => {
      acc[address.toLowerCase()] = {
        nickname: nicknames[index],
        avatar: avatars[index],
        socialAccount: socialAccounts[index]
      };
      return acc;
    }, {} as Record<string, { nickname: string; avatar: string; socialAccount: string }>);
  }, [profilesData, creatorAddresses]);

  // Convert BoardView to Quest type
  const boardToQuest = (board: BoardView): Quest => ({
    id: Number(board.id),
    creatorId: Number(board.creator),
    name: board.name,
    description: board.description,
    img: board.img || "",
    rewardToken: board.rewardToken,
    totalPledged: BigInt(board.totalPledged),
    createdAt: new Date(parseInt(board.createdAt.toString()) * 1000),
    closed: board.closed,
    config: board.config || "",
  });

  // Convert profile data to UserProfile type
  const profileToUserProfile = (profile: { nickname: string; avatar: string; socialAccount: string }): UserProfile => ({
    id: 0, // Default value since we don't have this information
    nickname: profile.nickname,
    avatar: profile.avatar,
    socialAccount: profile.socialAccount,
    updatedAt: new Date(),
    createdAt: new Date(),
  });

  // If the wallet is not connected, display a prompt message.
  if (!address) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-400">
          Please connect your wallet to view joined boards
        </h1>
      </div>
    );
  }

  if (isLoading) {
    return <BoardsPageSkeleton />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gradient">
          My Joined Quests
        </h1>
        <Button
          onClick={() => router.push('/quests/create')}
          className="bg-primary/20 text-foreground hover:bg-primary/30 backdrop-blur-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Quest
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(boardsData) && boardsData.map((board: BoardView) => (
          <BoardCard
            key={board.id.toString()}
            board={boardToQuest(board)}
            creatorProfile={creatorProfiles[board.creator.toLowerCase()] ?
              profileToUserProfile(creatorProfiles[board.creator.toLowerCase()]) :
              undefined}
          />
        ))}
      </div>
    </div>
  );
}

export default function JoinedBoardsPage() {
  return (
    <Suspense fallback={null}>
      <JoinedBoardsPageInner />
    </Suspense>
  );
}