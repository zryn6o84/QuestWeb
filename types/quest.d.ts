// Quest related interfaces
export interface Quest {
  id: string;
  name: string;
  description: string;
  img?: string;
  config?: string;
  createdAt: Date;
  updatedAt: Date;
  closed?: boolean;
  creatorId: string;
  creator: {
    id: string;
    nickname: string | null;
    avatar: string | null;
  };
  tasks: Task[];
  members: UserProfile[];
}

// Task related interfaces
export interface Task {
  id: string;
  questId: string;
  name: string;
  description: string;
  deadline: Date | string;
  maxCompletions: number;
  rewardAmount: string;
  config: TaskConfig;
  numCompletions: number;
  completed: boolean;
  cancelled: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  creatorId: string;
  creator?: {
    id: string;
    nickname: string | null;
    avatar: string | null;
    evmAddress?: string | null;
  };
  reviewers: TaskReviewer[];
  submissions: Submission[];
}

// Create task parameters interface
export interface CreateTaskParams {
  name: string;
  description: string;
  deadline: string;
  maxCompletions: number;
  rewardAmount: string | number;
  config: TaskConfig;
  questId?: string;
}

// Update task parameters interface
export interface UpdateTaskParams extends Partial<CreateTaskParams> {
  taskId: string;
}

// User profile interface
export interface UserProfile {
  id: string;
  address: string;
  nickname: string | null;
  avatar: string | null;
  socialAccounts?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Task reviewer interface
export interface TaskReviewer {
  userId: string;
  taskId: string;
  createdAt: Date;
  user: {
    id: string;
    nickname: string | null;
    avatar: string | null;
  };
}

// Task submission interface
export interface Submission {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    nickname: string | null;
    avatar: string | null;
  };
}

// Task config interface
export interface TaskConfig {
  taskType: string[];
  aiReview?: boolean;
  aiReviewPrompt?: string;
  contractNetwork?: string;
  XPostContent?: string;
  XFollowUsername?: string;
  XLikeId?: string;
  XRetweetId?: string;
  DiscordChannelId?: string;
  DiscordInviteLink?: string;
}

// Board config interface
export interface BoardConfig {
  channelId?: string;
  taskTypes?: string[];
  reviewerReward?: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
}