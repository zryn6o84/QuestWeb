import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import type { Quest, Task, Submission, CreateTaskParams, UpdateTaskParams, SubmitProofParams, ReviewSubmissionParams } from '@/types/quest'
import { questApi, taskApi, submissionApi } from '@/services/api'

// Query keys
export const questKeys = {
  all: ['quests'] as const,
  lists: () => [...questKeys.all, 'list'] as const,
  list: (filters: string) => [...questKeys.lists(), { filters }] as const,
  details: () => [...questKeys.all, 'detail'] as const,
  detail: (id: string) => [...questKeys.details(), id] as const,
  tasks: (questId: string) => [...questKeys.detail(questId), 'tasks'] as const,
  submissions: (questId: string, taskId: string) => [...questKeys.tasks(questId), taskId, 'submissions'] as const,
}

// Quest Hooks
export function useQuests(page = 1, limit = 10) {
  return useQuery({
    queryKey: [...questKeys.lists(), { page, limit }],
    queryFn: () => questApi.getAllQuests(page, limit),
  });
}

export function useQuestDetail<T = any>(questId: string) {
  return useQuery({
    queryKey: ['quest', questId],
    queryFn: async () => {
      const response = await fetch(`/api/quests/${questId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch quest');
      }
      const data = await response.json();
      console.log('Quest detail data:', data);
      return data as Promise<T>;
    },
  });
}

export function useQuestTasks(questId: string) {
  return useQuery({
    queryKey: questKeys.tasks(questId),
    queryFn: () => taskApi.getTasksForQuest(questId),
  })
}

export function useCreateQuestMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: questApi.createQuest,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: questKeys.lists() })
      toast({
        title: 'Success',
        description: 'Quest created successfully',
      })
    },
  })
}

export function useCreateTaskMutation(questId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreateTaskParams) => taskApi.createTask(questId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: questKeys.tasks(questId) })
      toast({
        title: 'Success',
        description: 'Task created successfully',
      })
    },
  })
}

export function useUpdateTaskMutation(questId: string, taskId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: UpdateTaskParams) => taskApi.updateTask(questId, taskId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: questKeys.tasks(questId) })
      toast({
        title: 'Success',
        description: 'Task updated successfully',
      })
    },
  })
}

export function useSubmitProofMutation(questId: string, taskId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: SubmitProofParams) => submissionApi.submitProof(questId, taskId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: questKeys.submissions(questId, taskId) })
      toast({
        title: 'Success',
        description: 'Proof submitted successfully',
      })
    },
  })
}

export function useReviewSubmissionMutation(questId: string, taskId: string, submissionId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: ReviewSubmissionParams) =>
      submissionApi.reviewSubmission(questId, taskId, submissionId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: questKeys.submissions(questId, taskId) })
      toast({
        title: 'Success',
        description: 'Submission reviewed successfully',
      })
    },
  })
}

export function useJoinQuestMutation(questId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (address: string) => questApi.joinQuest(questId, address),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: questKeys.detail(questId) })
      toast({
        title: 'Success',
        description: 'Joined quest successfully',
      })
    },
  })
}

export function useAddReviewerMutation(questId: string, taskId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (address: string) => taskApi.addReviewer(questId, taskId, address),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: questKeys.tasks(questId) })
      toast({
        title: 'Success',
        description: 'Reviewer added successfully',
      })
    },
  })
}

export function useIsQuestMember(questId: string, address: string | undefined) {
  return useQuery({
    queryKey: [...questKeys.detail(questId), 'isMember', address],
    queryFn: () => address ? questApi.isQuestMember(questId, address) : Promise.resolve(false),
    enabled: !!address,
  })
}

export function useQuestsByMember(address: string | undefined) {
  return useQuery({
    queryKey: [...questKeys.lists(), 'member', address],
    queryFn: () => address ? questApi.getQuestsByMember(address) : Promise.resolve([]),
    enabled: !!address,
  })
}