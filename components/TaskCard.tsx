import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import Image from 'next/image';
import { formatUnits } from 'viem';
import { cn } from '@/lib/utils';
import { TaskView } from '@/types/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toDate } from '@/lib/date';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  User2,
  Coins,
  UserPlus,
  Calendar,
  Clock,
  Tag,
  Pencil,
  X,
  Plus,
  Users,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

interface TaskCardProps {
  task: TaskView;
  onSelect: (task: TaskView) => void;
  onOpenSubmitModal: () => void;
  onOpenAddReviewerModal: (taskId: string) => void;
  onOpenUpdateTaskModal: (taskId: string) => void;
  onCancelTask: (taskId: string) => void;
  userTaskStatus: {
    isSubmitted: boolean;
    status: string;
  };
  isCreator: boolean;
  isMember: boolean;
  userProfiles?: Record<string, {
    nickname: string;
    avatar: string;
  }>;
  taskTypes: string;
  paymentInfo: string;
  isAiReview: boolean;
}

// 添加一个辅助函数来格式化奖励金额
const formatRewardAmount = (amount: string) => {
  try {
    const value = parseFloat(amount);
    return value.toFixed(2);
  } catch (e) {
    return '0.00';
  }
};

export default function TaskCard({
  task,
  onSelect,
  onOpenSubmitModal,
  onOpenAddReviewerModal,
  onOpenUpdateTaskModal,
  onCancelTask,
  userTaskStatus,
  isCreator,
  isMember,
  userProfiles = {},
  taskTypes,
  paymentInfo,
  isAiReview,
}: TaskCardProps) {
  const deadline = toDate(task.deadline);
  const isExpired = deadline.getTime() < Date.now();
  const isDisabled = task.cancelled || isExpired || task.completed;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20 hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{task.name}</h3>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">{taskTypes}</Badge>
              {isAiReview && <Badge variant="secondary">AI Review</Badge>}
              {task.cancelled && <Badge variant="destructive">Cancelled</Badge>}
              {task.completed && <Badge variant="success">Completed</Badge>}
              {isExpired && <Badge variant="destructive">Expired</Badge>}
            </div>
          </div>
          {isCreator && !task.completed && !task.cancelled && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenUpdateTaskModal(task.id)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onCancelTask(task.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{task.description}</p>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>Deadline: {format(deadline, "PPp")}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Coins className="h-4 w-4" />
              <span>{paymentInfo}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              <span>
                {task._count?.submissions || 0}/{task.maxCompletions} completed
                {task.submissions?.length > (task._count?.submissions || 0) &&
                  ` (${task.submissions.length - (task._count?.submissions || 0)} pending)`}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {task.reviewers.map((reviewer) => (
              <Badge key={reviewer.userId} variant="outline" className="flex items-center gap-1">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={reviewer.user.avatar || undefined} />
                  <AvatarFallback>
                    {reviewer.user.nickname?.slice(0, 2).toUpperCase() || "??"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs">{reviewer.user.nickname || "Anonymous"}</span>
              </Badge>
            ))}
            {isCreator && !task.completed && !task.cancelled && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenAddReviewerModal(task.id)}
                className="h-6"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Reviewer
              </Button>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={task.creator.avatar || undefined} />
            <AvatarFallback>
              {task.creator.nickname?.slice(0, 2).toUpperCase() || "??"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{task.creator.nickname || "Anonymous"}</span>
        </div>

        <div className="flex gap-2">
          {userTaskStatus.isSubmitted ? (
            <Badge variant={userTaskStatus.status === "approved" ? "success" : "secondary"}>
              {userTaskStatus.status === "approved" ? "Approved" : "Pending"}
            </Badge>
          ) : (
            <Button
              size="sm"
              onClick={onOpenSubmitModal}
              disabled={isDisabled || !isMember}
            >
              Submit Proof
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect(task)}
          >
            View Details
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}