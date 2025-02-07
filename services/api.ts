import { Quest, Task, Submission, UserProfile, CreateTaskParams, UpdateTaskParams, SubmitProofParams, ReviewSubmissionParams } from '@/types/quest';

// Quest APIs
export const questApi = {
  getAllQuests: async (page = 1, limit = 10): Promise<Quest[]> => {
    const response = await fetch(`/api/quests?page=${page}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch quests');
    }
    return response.json();
  },

  getQuestDetail: async (id: string): Promise<Quest> => {
    const response = await fetch(`/api/quests/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch quest detail');
    }
    return response.json();
  },

  createQuest: async (data: Partial<Quest>): Promise<Quest> => {
    const response = await fetch('/api/quests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create quest');
    }
    return response.json();
  },

  updateQuest: async (id: string, data: Partial<Quest>): Promise<Quest> => {
    const response = await fetch(`/api/quests?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update quest');
    }
    return response.json();
  },

  joinQuest: async (questId: string, address: string): Promise<any> => {
    const response = await fetch(`/api/quests/${questId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to join quest');
    }
    return response.json();
  },

  isQuestMember: async (questId: string, address: string): Promise<boolean> => {
    const response = await fetch(`/api/quests/${questId}/members?address=${address}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check membership');
    }
    const data = await response.json();
    return data.isMember;
  },

  getQuestsByMember: async (address: string): Promise<Quest[]> => {
    const response = await fetch(`/api/user/quests?address=${address}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch member quests');
    }
    return response.json();
  },
};

// Task APIs
export const taskApi = {
  getTasksForQuest: async (questId: string): Promise<Task[]> => {
    const response = await fetch(`/api/quests/${questId}/tasks`);
    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }
    return response.json();
  },

  createTask: async (questId: string, data: CreateTaskParams): Promise<Task> => {
    const response = await fetch(`/api/quests/${questId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create task');
    }
    return response.json();
  },

  updateTask: async (questId: string, taskId: string, data: UpdateTaskParams): Promise<Task> => {
    const response = await fetch(`/api/quests/${questId}/tasks?taskId=${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update task');
    }
    return response.json();
  },

  addReviewer: async (questId: string, taskId: string, address: string): Promise<any> => {
    const response = await fetch(`/api/quests/${questId}/tasks/${taskId}/reviewers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add reviewer');
    }
    return response.json();
  },

  isReviewer: async (questId: string, taskId: string, address: string): Promise<boolean> => {
    const response = await fetch(`/api/quests/${questId}/tasks/${taskId}/reviewers?address=${address}`);
    const data = await response.json();
    return data.isReviewer;
  },
};

// Submission APIs
export const submissionApi = {
  submitProof: async (questId: string, taskId: string, data: SubmitProofParams): Promise<Submission> => {
    const response = await fetch(`/api/quests/${questId}/tasks/${taskId}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit proof');
    }
    return response.json();
  },

  reviewSubmission: async (
    questId: string,
    taskId: string,
    submissionId: string,
    data: ReviewSubmissionParams
  ): Promise<Submission> => {
    const response = await fetch(
      `/api/quests/${questId}/tasks/${taskId}/submissions?submissionId=${submissionId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to review submission');
    }
    return response.json();
  },

  getSubmissions: async (questId: string, taskId: string, submitter?: string): Promise<Submission[]> => {
    const url = submitter
      ? `/api/quests/${questId}/tasks/${taskId}/submissions?submitter=${submitter}`
      : `/api/quests/${questId}/tasks/${taskId}/submissions`;
    const response = await fetch(url);
    return response.json();
  },
};

// User Profile APIs
export const userApi = {
  getProfile: async (address: string): Promise<UserProfile | null> => {
    const response = await fetch(`/api/user/profile?address=${address}`);
    return response.json();
  },

  updateProfile: async (data: Partial<UserProfile> & { signature?: string }): Promise<UserProfile> => {
    const response = await fetch('/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};