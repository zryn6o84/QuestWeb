"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Clock,
  Coins,
  MoreHorizontal,
  User2,
  UserPlus,
} from "lucide-react";
import { format } from "date-fns";
import { Address } from "./ui/Address";
import { Chain, formatUnits } from "viem";
import {
  TaskView,
  SubmissionProof,
  UserTaskStatus,
  BoardConfig,
  ModalConfigType,
} from "@/types/types";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "./ui/badge";
import SubmitProofModal from "./SubmitProofModal";
import { useSubmitProof, useSelfCheckSubmission } from "@/hooks/useContract";
import { useToast } from "./ui/use-toast";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import TaskCard from './TaskCard';

interface TaskListProps {
  questId: string;
  boardConfig: BoardConfig;
  tasks: TaskView[];
  userTaskStatuses: UserTaskStatus[];
  onTaskSelect: (task: TaskView) => void;
  onOpenSubmitModal: (taskId: string) => void;
  onOpenAddReviewerModal: (taskId: string) => void;
  onOpenUpdateTaskModal: (taskId: string) => void;
  onCancelTask: (taskId: string) => void;
  refetch: () => void;
  userProfiles?: Record<string, { nickname: string; avatar: string }>;
  isCreator: boolean;
  isMember: boolean;
  onRefresh?: () => void;
}

export default function TaskList({
  questId,
  boardConfig,
  tasks,
  userTaskStatuses = [],
  onTaskSelect,
  onOpenSubmitModal,
  onOpenAddReviewerModal,
  onOpenUpdateTaskModal,
  onCancelTask,
  refetch,
  userProfiles = {},
  isCreator,
  isMember,
  onRefresh,
}: TaskListProps) {
  const [selectedTask, setSelectedTask] = useState<TaskView | null>(null);
  const [isSubmitProofModalOpen, setIsSubmitProofModalOpen] = useState(false);

  const getTaskStatus = (task: TaskView): { isSubmitted: boolean; status: string } => {
    if (!userTaskStatuses) {
      return {
        isSubmitted: false,
        status: 'pending'
      };
    }

    const status = userTaskStatuses.find(
      (status) => status.taskId === task.id
    );

    return {
      isSubmitted: !!status,
      status: status?.status || 'pending'
    };
  };

  const handleCancelTask = async (task: TaskView): Promise<void> => {
    if (!isCreator || !task?.id) return;
    onCancelTask(task.id);
  };

  const handleSubmitProof = async (data: any) => {
    try {
      if (!selectedTask) return;

      const response = await fetch(`/api/quests/${questId}/tasks/${selectedTask.id}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: JSON.stringify(data)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit proof');
      }

      setIsSubmitProofModalOpen(false);
      setSelectedTask(null);
      if (onRefresh) {
        onRefresh();
      }
      return {};
    } catch (error) {
      console.error('Error submitting proof:', error);
      throw error;
    }
  };

  const handleOpenSubmitModal = (task: TaskView) => {
    setSelectedTask(task);
    setIsSubmitProofModalOpen(true);
  };

  const handleViewDetails = (task: TaskView): void => {
    onTaskSelect(task);
  };

  const renderTaskCard = (task: TaskView): JSX.Element | null => {
    if (!task?.id) return null;

    const taskStatus = getTaskStatus(task);
    const isExpired = task.deadline && new Date(task.deadline).getTime() < Date.now();
    const isDisabled = task.cancelled || isExpired || task.completed;

    // Parse task configuration
    let taskConfig;
    try {
      // Handle both string and object formats
      if (typeof task.config === 'string') {
        try {
          taskConfig = JSON.parse(task.config);
        } catch (e) {
          console.error('First JSON.parse failed:', e);
          // Try parsing twice in case of double stringification
          taskConfig = JSON.parse(JSON.parse(task.config));
        }
      } else {
        taskConfig = task.config;
      }
    } catch (error) {
      console.error('Error parsing task config:', error);
      taskConfig = { taskType: [], paymentTokenSymbol: 'ETH', paymentChain: 'Unknown' };
    }

    const taskTypes = Array.isArray(taskConfig.taskType) ? taskConfig.taskType.join(", ") : '';
    const paymentInfo = `${task.rewardAmount} ${taskConfig.paymentTokenSymbol || 'ETH'} on ${taskConfig.paymentChain || 'Unknown'}`;
    const isAiReview = !!taskConfig.aiReview;

    return (
      <TaskCard
        key={task.id}
        task={task}
        onSelect={() => handleViewDetails(task)}
        onOpenSubmitModal={() => handleOpenSubmitModal(task)}
        onOpenAddReviewerModal={() => isCreator && onOpenAddReviewerModal(task.id)}
        onOpenUpdateTaskModal={() => isCreator && onOpenUpdateTaskModal(task.id)}
        onCancelTask={() => isCreator && handleCancelTask(task)}
        userTaskStatus={taskStatus}
        isCreator={isCreator}
        isMember={isMember}
        userProfiles={userProfiles}
        taskTypes={taskTypes}
        paymentInfo={paymentInfo}
        isAiReview={isAiReview}
      />
    );
  };

  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {tasks.map((task) => (
          <li key={task.id}>{renderTaskCard(task)}</li>
        ))}
      </ul>

      {selectedTask && (
        <SubmitProofModal
          isOpen={isSubmitProofModalOpen}
          onClose={() => {
            setIsSubmitProofModalOpen(false);
            setSelectedTask(null);
          }}
          taskConfig={typeof selectedTask.config === 'string' ? JSON.parse(selectedTask.config) : selectedTask.config}
          onSubmit={handleSubmitProof}
          onConfirmed={() => {
            if (onRefresh) {
              onRefresh();
            }
          }}
        />
      )}
    </div>
  );
}
