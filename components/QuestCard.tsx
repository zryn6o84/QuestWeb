'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { User2 } from 'lucide-react';
import { Quest } from '@/types/quest';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface QuestCardProps {
  board: Quest;
  creatorProfile?: {
    id: string;
    nickname?: string | null;
    avatar?: string | null;
  };
}

export default function QuestCard({ board, creatorProfile }: QuestCardProps) {
  const [tokenSymbol, setTokenSymbol] = useState<string>('ETH');

  useEffect(() => {
    const fetchTokenSymbol = async () => {
      try {
        const response = await fetch(`/api/token/symbol?address=${board.rewardToken}`);
        const data = await response.json();
        if (data.success) {
          setTokenSymbol(data.symbol);
        }
      } catch (error) {
        console.error('Failed to fetch token symbol:', error);
      }
    };

    if (board.rewardToken) {
      fetchTokenSymbol();
    }
  }, [board.rewardToken]);

  return (
    <Link href={`/quest/${board.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow duration-200 bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader className="relative">
          {board.img && (
            <div className="w-full h-48 relative rounded-t-lg overflow-hidden">
              <img
                src={board.img}
                alt={board.name}
                className="object-cover w-full h-full"
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{board.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {board.description}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={creatorProfile?.avatar || undefined} />
              <AvatarFallback>
                {creatorProfile?.nickname?.slice(0, 2).toUpperCase() || "??"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{creatorProfile?.nickname || "Anonymous"}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(board.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
          {board.closed && (
            <Button variant="outline" size="sm" className="ml-auto" disabled>
              Closed
            </Button>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
