import { useToast } from "@/components/ui/use-toast";
import { useCallback } from "react";

// Types
export interface CreateQuestParams {
  creator: string;
  name: string;
  description: string;
  img?: string;
  rewardToken?: string;
  totalPledged?: string;
  config?: string;
}

export interface CreateTaskParams {
  creator: string;
  name: string;
  description: string;
  /**
   * The deadline for the task, represented as a Date object.
   * Convert to a timestamp only when interacting with the backend or database.
   */
  deadline?: Date;
  maxCompletions: number;
  rewardAmount: string;
  config?: string;
  allowSelfCheck?: boolean;
}

export interface UpdateTaskParams {
  name: string;
  description: string;
  deadline?: number;
  maxCompletions: number;
  rewardAmount: string;
  config?: string;
  allowSelfCheck?: boolean;
}

export interface SubmitProofParams {
  submitter: string;
  proof: string;
}

export interface ReviewSubmissionParams {
  reviewedBy: string;
  status: number;
  reviewComment?: string;
}

// API Hooks
export function useCreateQuest() {
  const { toast } = useToast();

  return useCallback(async (params: CreateQuestParams) => {
    try {
      const response = await fetch('/api/quests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create quest');
      }

      return await response.json();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);
}

export function useCreateTask() {
  const { toast } = useToast();

  return useCallback(async (questId: number, params: CreateTaskParams) => {
    try {
      const response = await fetch(`/api/quests/${questId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create task');
      }

      return await response.json();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);
}

export function useUpdateTask() {
  const { toast } = useToast();

  return useCallback(async (questId: number, taskId: number, params: UpdateTaskParams) => {
    try {
      const response = await fetch(`/api/quests/${questId}/tasks?taskId=${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update task');
      }

      return await response.json();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);
}

export function useSubmitProof() {
  const { toast } = useToast();

  return useCallback(async (questId: number, taskId: number, params: SubmitProofParams) => {
    try {
      const response = await fetch(`/api/quests/${questId}/tasks/${taskId}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit proof');
      }

      return await response.json();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);
}

export function useReviewSubmission() {
  const { toast } = useToast();

  return useCallback(async (questId: number, taskId: number, submissionId: number, params: ReviewSubmissionParams) => {
    try {
      const response = await fetch(`/api/quests/${questId}/tasks/${taskId}/submissions?submissionId=${submissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to review submission');
      }

      return await response.json();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);
}

export function useJoinQuest() {
  const { toast } = useToast();

  return useCallback(async (questId: number, address: string) => {
    try {
      const response = await fetch(`/api/quests/${questId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join quest');
      }

      return await response.json();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);
}

export function useAddReviewer() {
  const { toast } = useToast();

  return useCallback(async (questId: number, taskId: number, address: string) => {
    try {
      const response = await fetch(`/api/quests/${questId}/tasks/${taskId}/reviewers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add reviewer');
      }

      return await response.json();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);
}

// Query Hooks
export function useGetAllQuests() {
  const { toast } = useToast();

  return useCallback(async () => {
    try {
      const response = await fetch('/api/quests');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch quests');
      }
      return await response.json();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);
}

export function useGetQuestDetail() {
  const { toast } = useToast();

  return useCallback(async (questId: number) => {
    try {
      const response = await fetch(`/api/quests/${questId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch quest details');
      }
      return await response.json();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);
}

export function useGetTasksForQuest() {
  const { toast } = useToast();

  return useCallback(async (questId: number) => {
    try {
      const response = await fetch(`/api/quests/${questId}/tasks`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch tasks');
      }
      return await response.json();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);
}

export function useIsQuestMember() {
  const { toast } = useToast();

  return useCallback(async (questId: number, address: string) => {
    try {
      const response = await fetch(`/api/quests/${questId}/members?address=${address}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to check membership');
      }
      const data = await response.json();
      return data.isMember;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);
}

export function useGetQuestsByMember() {
  const { toast } = useToast();

  return useCallback(async (address: string) => {
    try {
      const response = await fetch(`/api/user/profile?address=${address}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch member quests');
      }
      const profile = await response.json();
      return profile.memberQuests;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);
}