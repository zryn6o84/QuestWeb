export interface Submission {
  id: string;
  submitter: `0x${string}`;
  proof: string;
  status: number; // 0: pending, 1: approved, -1: rejected, 2: payed
  submittedAt: string;
  reviewComment?: string;
  reviewedAt?: string;
  reviewerId?: string;
}

export interface Member {
  id: string;
  userId: string;
  questId: string;
  createdAt: string;
  user?: {
    id: string;
    nickname: string | null;
    avatar: string | null;
  };
}

// Quest related interfaces
export interface BoardView {
  id: string;
  creatorId: number;
  creator: `0x${string}`;
  name: string;
  description: string;
  img: string;
  totalPledged: bigint;
  createdAt: string;
  closed: boolean;
  rewardToken: `0x${string}`;
  config: string;
}

export interface BoardConfig {
  channelId?: string;
  taskTypes?: string[];
  reviewerReward?: string;
  minStake?: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
}

// Task related interfaces
export interface TaskView {
  id: string;
  questId: string;
  name: string;
  description: string;
  deadline: string;
  maxCompletions: number;
  rewardAmount: string;
  config: TaskConfig;
  completed: boolean;
  cancelled: boolean;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
  creator: {
    id: string;
    name: string | null;
    email: string | null;
    nickname: string | null;
    avatar: string | null;
    image: string | null;
  };
  reviewers: Array<{
    userId: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      nickname: string | null;
      avatar: string | null;
      image: string | null;
    };
  }>;
  submissions: any[];
  _count: {
    submissions: number;
  };
}


// Submission related interfaces
export interface SubmissionView {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  status: string;
  createdAt: string;
  reviewComment?: string;
  reviewedAt?: string;
  reviewerId?: string;
  task: {
    id: string;
    name: string;
    questId: string;
    config: TaskConfig;
  };
  user: {
    id: string;
    nickname: string | null;
    avatar: string | null;
  };
  reviewer?: {
    id: string;
    nickname: string | null;
    avatar: string | null;
  };
}

// Quest Detail View Interface
export interface BoardDetailView {
  id: string;
  creator: {
    id: string;
    nickname: string | null;
    avatar: string | null;
  };
  creatorId: string;
  name: string;
  description: string;
  img: string;
  totalPledged: bigint;
  createdAt: string;
  closed: boolean;
  rewardToken: string;
  tasks: TaskView[];
  submissions: SubmissionView[][];
  members: Member[];
  userTaskStatuses: UserTaskStatus[];
  config: string;
}

// Create parameter interface for Quest
export interface CreateBoardParams {
  name: string;
  description: string;
  img: string;
  rewardToken: string;
  config?: string;
}

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
  paymentChain: 'ETH' | 'SOL' | 'MINA';
  paymentNetwork: string;
  paymentToken: string;
  paymentTokenSymbol: string;
  paymentTokenDecimals: number;
}

// Interface for creating Task parameters
export interface CreateTaskParams {
  questId: string;
  name: string;
  description: string;
  deadline: string;
  maxCompletions: number;
  rewardAmount: bigint;
  config: TaskConfig;
}

// Update the parameter interface of Task
export interface UpdateTaskParams extends CreateTaskParams {
  taskId: string;
}

export interface SubmissionProof {
  text?: string;
  image?: string;
  github?: string;
  contract?: string;
  xId?: string;
  xUserName?: string;
  xName?: string;
  xPost?: string;
  xFollow?: boolean;
  xRetweet?: boolean;
  xLike?: boolean;
  discordId?: string;
  discordUserName?: string;
  discordName?: string;
  discordJoined?: boolean;
  discordJoinedAt?: string;
}

export interface SelfCheckParams {
  questId: string;
  taskId: string;
  signature: `0x${string}`;
  checkData: string;
}

// Interface for submitting Proof parameters
export interface SubmitProofParams {
  questId: string;
  taskId: string;
  proof: string;
}

// Interface for auditing submitted parameters
export interface ReviewSubmissionParams {
  questId: string;
  taskId: string;
  submissionAddress: `0x${string}`;
  approved: number;
  reviewComment: string;
}

// Add the parameter interface for the auditor
export interface AddReviewerParams {
  questId: string;
  taskId: string;
  reviewer: string;
}

// Parameters interface for staking tokens
export interface PledgeTokensParams {
  questId: string;
  amount: bigint;
}

// Update the parameter interface of Quest
export interface UpdateBoardParams {
  questId: string;
  name: string;
  description: string;
  rewardToken: string;
}

// TaskDetailView
export interface TaskDetailView {
  id: string;
  questId: number;
  chainTaskId: number;
  name: string;
  creator: `0x${string}`;
  description: string;
  deadline: string;
  maxCompletions: number;
  numCompletions: number;
  completed: boolean;
  rewardAmount: bigint;
  createdAt: string;
  cancelled: boolean;
  config: string;
  allowSelfCheck: boolean;
}

// User task status interface
export interface UserTaskStatus {
  taskId: string;
  submitted: boolean;
  status: string;
  submittedAt: string;
  submitProof: string;
  reviewComment: string;
}

export interface ModalConfigType {
  submitProof: {
    title: string;
    description: string;
    fields: { name: string; label: string; type: string }[];
  };
  reviewSubmission: {
    title: string;
    description: string;
    fields: { name: string; label: string; type: string }[];
  };
  addReviewer: {
    title: string;
    description: string;
    fields: { name: string; label: string; type: string }[];
  };
  updateBoard: {
    title: string;
    description: string;
    fields: { name: string; label: string; type: string }[];
  };
  pledgeTokens: {
    title: string;
    description: string;
    fields: { name: string; label: string; type: string }[];
  };
}
