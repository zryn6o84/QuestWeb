export interface UserProfile {
  id: string;
  nickname: string;
  avatar?: string;
  email?: string;
  socialAccount?: string;
  wallets?: {
    evm?: string;
    solana?: string;
    auro?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Quest {
  id: number;
  creatorId: number;
  name: string;
  description: string;
  img: string;
  rewardToken: string;
  totalPledged: bigint;
  createdAt: Date;
  closed: boolean;
  config: string;
  createdBy?: UserProfile;
  tasks?: Task[];
  members?: Member[];
}

export interface Task {
  id: number;
  questId: number;
  creatorId: number;
  name: string;
  description: string;
  deadline?: Date;
  maxCompletions: number;
  numCompletions: number;
  completed: boolean;
  rewardAmount: bigint;
  createdAt: Date;
  updatedAt: Date;
  cancelled: boolean;
  config: string;
  allowSelfCheck: boolean;
  createdBy?: UserProfile;
  quest?: Quest;
  reviewers?: Reviewer[];
  submissions?: Submission[];
}

export interface Member {
  id: number;
  userId: number;
  questId: number;
  user?: UserProfile;
  quest?: Quest;
}

export interface Reviewer {
  id: number;
  userId: number;
  taskId: number;
  user?: UserProfile;
  task?: Task;
}

export interface Submission {
  id: number;
  taskId: number;
  submitterId: number;
  proof: string;
  status: number;
  submittedAt: Date;
  reviewComment?: string;
  reviewedAt?: Date;
  reviewerId?: number;
  task?: Task;
  submittedBy?: UserProfile;
  reviewedBy?: UserProfile;
}

export interface ActivityLog {
  id: number;
  userId: number;
  action: string;
  details: string;
  createdAt: Date;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  message: string;
  read: boolean;
  createdAt: Date;
  data?: string;
}

export interface CreateTaskParams {
  name: string;
  description: string;
  /**
   * The deadline for the task, represented as a Date object.
   * Convert to a timestamp only when interacting with the backend or database.
   */
  deadline?: Date;
  maxCompletions: number;
  rewardAmount: number;
  config: string;
  allowSelfCheck: boolean;
}

export interface UpdateTaskParams extends Partial<CreateTaskParams> {
  taskId: number;
}

export interface SubmitProofParams {
  submitter: string;
  proof: string;
}

export interface ReviewSubmissionParams {
  status: number;
  reviewComment?: string;
  reviewedBy?: string;
}

export interface BoardConfig {
  channelId?: string;
  taskTypes?: string[];
  [key: string]: any;
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
  // Payment related fields
  paymentChain: 'ETH' | 'SOL' | 'MINA'; // The blockchain to use for payment
  paymentNetwork?: string; // Specific network for the chain (e.g. mainnet, testnet)
  paymentToken: string; // Token address or 'NATIVE' for native tokens
  paymentTokenSymbol: string; // Token symbol (e.g. 'ETH', 'USDT', 'SOL')
  paymentTokenDecimals: number; // Token decimals
}

// Add supported networks configuration
export const SUPPORTED_NETWORKS = {
  ETH: [
    { name: 'Ethereum Mainnet', id: '1', nativeCurrency: 'ETH' },
    { name: 'Sepolia', id: '11155111', nativeCurrency: 'ETH' },
    { name: 'BSC', id: '56', nativeCurrency: 'BNB' },
    { name: 'BSC Testnet', id: '97', nativeCurrency: 'BNB' },
    { name: 'Mantle', id: '5000', nativeCurrency: 'MNT' },
    { name: 'Mantle Testnet', id: '5001', nativeCurrency: 'MNT' },
    { name: 'opBNB', id: '204', nativeCurrency: 'BNB' },
    { name: 'opBNB Testnet', id: '5611', nativeCurrency: 'BNB' },
    { name: 'Linea', id: '59144', nativeCurrency: 'ETH' },
    { name: 'Linea Testnet', id: '59140', nativeCurrency: 'ETH' },
  ],
  SOL: [
    { name: 'Solana Mainnet', id: 'mainnet-beta', nativeCurrency: 'SOL' },
    { name: 'Solana Devnet', id: 'devnet', nativeCurrency: 'SOL' },
    { name: 'Solana Testnet', id: 'testnet', nativeCurrency: 'SOL' },
  ],
  MINA: [
    { name: 'Mina Mainnet', id: 'mainnet', nativeCurrency: 'MINA' },
    { name: 'Mina Devnet', id: 'devnet', nativeCurrency: 'MINA' },
    { name: 'Mina Testnet', id: 'testnet', nativeCurrency: 'MINA' },
  ],
} as const;

// Common tokens configuration
export const COMMON_TOKENS = {
  ETH: [
    { symbol: 'ETH', name: 'Ethereum', decimals: 18, isNative: true },
    { symbol: 'USDT', name: 'Tether USD', decimals: 6, addresses: {
      '1': '0xdac17f958d2ee523a2206206994597c13d831ec7', // Ethereum Mainnet
      '11155111': '0x...', // Sepolia
      // Add other network addresses
    }},
    // Add other common ERC20 tokens
  ],
  SOL: [
    { symbol: 'SOL', name: 'Solana', decimals: 9, isNative: true },
    { symbol: 'USDT', name: 'Tether USD', decimals: 6, addresses: {
      'mainnet-beta': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      // Add other network addresses
    }},
    // Add other common SPL tokens
  ],
  MINA: [
    { symbol: 'MINA', name: 'Mina Protocol', decimals: 9, isNative: true },
    // Add other Mina tokens when available
  ],
} as const;

export interface SubmissionProof {
  text?: string;
  image?: string;
  github?: string;
  contract?: string;
  xUserName?: string;
  xName?: string;
  xId?: string;
  xFollow?: boolean;
  xLike?: boolean;
  xRetweet?: boolean;
  discordUserName?: string;
  discordName?: string;
  discordId?: string;
  encryptedTokens?: string;
  [key: string]: any;
}