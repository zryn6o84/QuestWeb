import {
  useAccount,
  useReadContract,
  useWriteContract,
  type BaseError,
} from "wagmi";
import { useToast } from "@/components/ui/use-toast";
import abi from "@/constants/QuestWeb.json";
import { erc20Abi, parseUnits, zeroAddress } from "viem";
import type {
  BoardView,
  TaskView,
  BoardDetailView,
  CreateBoardParams,
  CreateTaskParams,
  UpdateTaskParams,
  SubmitProofParams,
  ReviewSubmissionParams,
  AddReviewerParams,
  PledgeTokensParams,
  SelfCheckParams,
} from "@/types/types";
import contractAddress from "@/constants/contract-address";
import userProfileAbi from "@/constants/UserProfile.json";
import { getNativeTokenSymbol } from "@/utils/chain";

function getUserProfileAddress(chain?: { name: string }) {
  return contractAddress.UserProfile[
    (chain?.name || 'Linea Sepolia Testnet') as keyof typeof contractAddress.UserProfile
  ] as `0x${string}`;
}

export function useQuestWebFunction(functionName: string) {
  const { writeContractAsync } = useWriteContract();
  const { toast } = useToast();
  const { chain } = useAccount();
  return async (args: any[], value?: bigint) => {
    console.log("Contract Function:", functionName, args);
    try {
      toast({
        title: "Notification",
        description: "Please confirm the transaction in your wallet.",
      });

      const QuestWebAddress = contractAddress.QuestWeb[chain?.name as keyof typeof contractAddress.QuestWeb] as `0x${string}`;

      const hash = await writeContractAsync({
        functionName,
        abi,
        address: QuestWebAddress,
        args,
        value,
      });
      return { hash };
    } catch (err: BaseError | any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      console.error("Write Error:", err);
      return { error: err.message };
    }
  };
}

// Create a board/forum section
export function useCreateBoard() {
  const contractFunction = useQuestWebFunction("createQuestWeb");

  return ({ name, description, img, rewardToken, config }: CreateBoardParams) => {
    if (!rewardToken) {
      rewardToken = zeroAddress;
    }
    if (!config) {
      config = "{}";
    }
    return contractFunction([name, description, img, rewardToken, config]);
  };
}

// Create task
export function useCreateTask() {
  const contractFunction = useQuestWebFunction("createTask");

  return ({
    questId,
    name,
    description,
    deadline,
    maxCompletions,
    rewardAmount,
    config,
    allowSelfCheck,
  }: CreateTaskParams) => {
    const formatAmount = parseUnits(rewardAmount.toString(), 18);
    return contractFunction([
      questId,
      name,
      description,
      deadline,
      maxCompletions,
      formatAmount,
      config,
      allowSelfCheck,
    ]);
  };
}

// Update task
export function useUpdateTask() {
  const contractFunction = useQuestWebFunction("updateTask");

  return ({
    questId,
    taskId,
    name,
    description,
    deadline,
    maxCompletions,
    rewardAmount,
    config,
    allowSelfCheck,
  }: UpdateTaskParams) => {
    const formatAmount = parseUnits(rewardAmount.toString(), 18);
    return contractFunction([
      questId,
      taskId,
      name,
      description,
      deadline,
      maxCompletions,
      formatAmount,
      config,
      allowSelfCheck,
    ]);
  };
}

// Submit proof
export function useSubmitProof() {
  const contractFunction = useQuestWebFunction("submitProof");

  return ({ questId, taskId, proof }: SubmitProofParams) => {
    return contractFunction([questId, taskId, proof]);
  };
}

// Review submission
export function useReviewSubmission() {
  const contractFunction = useQuestWebFunction("reviewSubmission");

  return ({
    questId,
    taskId,
    submissionAddress,
    approved,
    reviewComment
  }: ReviewSubmissionParams) => {
    if (approved === undefined) {
      approved = 0;
    }
    return contractFunction([questId, taskId, submissionAddress, approved, reviewComment || '']);
  };
}

// Self-check commit
export function useSelfCheckSubmission() {
  const contractFunction = useQuestWebFunction('selfCheckSubmission');

  return async ({
    questId,
    taskId,
    signature,
    checkData
  }: {
    questId: bigint;
    taskId: bigint;
    signature: `0x${string}`;
    checkData: string;
  }) => {
    return contractFunction([questId, taskId, signature, checkData]);
  };
}


// Add auditor
export function useAddReviewerToTask() {
  const contractFunction = useQuestWebFunction("addReviewerToTask");

  return ({ questId, taskId, reviewer }: AddReviewerParams) => {
    return contractFunction([questId, taskId, reviewer]);
  };
}

// Self-inspection
export function useSelfCheck() {
  const contractFunction = useQuestWebFunction("selfCheck");

  return ({ questId, taskId, checkData, signature }: SelfCheckParams) => {
    return contractFunction([questId, taskId, checkData, signature]);
  };
}

// Cancel task
export function useCancelTask() {
  const contractFunction = useQuestWebFunction("cancelTask");

  return ({ questId, taskId }: { questId: bigint; taskId: bigint }) => {
    return contractFunction([questId, taskId]);
  };
}

// Authorized token
export function useApproveTokens(tokenAddress: `0x${string}`) {
  const { writeContractAsync } = useWriteContract();
  const { toast } = useToast();
  const { chain } = useAccount();
  const QuestWebAddress = contractAddress.QuestWeb[chain?.name as keyof typeof contractAddress.QuestWeb] as `0x${string}`;

  return async (amount: bigint) => {
    try {
      toast({
        title: "Notification",
        description: "Please confirm the transaction in your wallet.",
      });
      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [QuestWebAddress, amount],
      });
      return { hash };
    } catch (error: Error | any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      return { error: error.message };
    }
  };
}

// Pledged tokens
export function usePledgeTokens(tokenAddress: `0x${string}`) {
  const { address, chain } = useAccount();
  const QuestWebAddress = contractAddress.QuestWeb[chain?.name as keyof typeof contractAddress.QuestWeb] as `0x${string}`;
  const { data: allowance, refetch } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address as `0x${string}`, QuestWebAddress],
  });
  const { toast } = useToast();
  const contractFunction = useQuestWebFunction("pledgeTokens");

  return async ({ questId, amount }: PledgeTokensParams) => {
    await refetch();
    const formatAmount = parseUnits(amount.toString(), 18);
    const allowanceNumber = allowance ? Number(allowance) : 0;

    if (allowanceNumber < formatAmount && tokenAddress !== zeroAddress) {
      toast({
        title: "Need Approval",
        description: "Please approve the contract to spend your tokens.",
      });
      throw new Error("Need Approval");
    } else if (tokenAddress === zeroAddress) {
      toast({
        title: "Warning",
        description:
          "You are pledging native token, please confirm the transaction in your wallet.",
      });
      return await contractFunction([questId, formatAmount], formatAmount);
    }
    return await contractFunction([questId, formatAmount]);
  };
}

// Add QuestWeb
export function useJoinBoard() {
  const contractFunction = useQuestWebFunction("joinBoard");

  return ({ questId }: { questId: bigint }) => {
    return contractFunction([questId]);
  };
}

// Add auditor
export function useAddReviewerToBounty() {
  const contractFunction = useQuestWebFunction("addReviewerToBounty");

  return ({
    questId,
    bountyId,
    reviewer,
  }: {
    questId: number;
    bountyId: number;
    reviewer: string;
  }) => {
    return contractFunction([questId, bountyId, reviewer]);
  };
}

// Cancel bounty task
export function useCancelBounty() {
  const contractFunction = useQuestWebFunction("cancelBounty");

  return ({ questId, bountyId }: { questId: bigint; bountyId: bigint }) => {
    return contractFunction([questId, bountyId]);
  };
}

// Close the QuestWeb.
export function useCloseBoard() {
  const contractFunction = useQuestWebFunction("closeBoard");

  return ({ questId }: { questId: bigint }) => {
    return contractFunction([questId]);
  };
}

// Extract staked tokens
export function useWithdrawPledgedTokens() {
  const contractFunction = useQuestWebFunction("withdrawPledgedTokens");

  return ({ questId }: { questId: bigint }) => {
    return contractFunction([questId]);
  };
}

// Update QuestWeb
export function useUpdateQuestWeb() {
  const contractFunction = useQuestWebFunction("updateQuestWeb");

  return ({
    id,
    name,
    description,
    img,
    rewardToken,
    config,
  }: {
    id: bigint;
    name: string;
    description: string;
    img: string;
    rewardToken: string;
    config: string;
  }) => {
    if (!rewardToken) {
      rewardToken = zeroAddress;
    }
    if (!config) {
      config = "{}";
    }
    return contractFunction([id, name, description, img, rewardToken, config]);
  };
}

export function useTokenSymbol(rewardTokenAddress: `0x${string}`) {
  return useReadContract({
    address: rewardTokenAddress,
    abi: erc20Abi,
    functionName: "symbol",
  });
}


// Read function
export function useGetAllBoards() {
  const { chain } = useAccount();

  const QuestWebAddress = contractAddress.QuestWeb[
    (chain?.name || 'Linea Sepolia Testnet') as keyof typeof contractAddress.QuestWeb
  ] as `0x${string}`;

  return useReadContract<typeof abi, "getAllBoards", BoardView[]>({
    address: QuestWebAddress,
    abi,
    functionName: "getAllBoards",
    query: {
      enabled: true,
      gcTime: 0,
    }
  });
}
export function useGetBoardDetail(questId: bigint) {
  const { chain, address } = useAccount();

  const QuestWebAddress = contractAddress.QuestWeb[
    (chain?.name || 'Linea Sepolia Testnet') as keyof typeof contractAddress.QuestWeb
  ] as `0x${string}`;

  return useReadContract<typeof abi, "getBoardDetail", [BoardDetailView]>({
    address: QuestWebAddress,
    abi,
    functionName: "getBoardDetail",
    args: [questId],
    account: address || zeroAddress,
    query: {
      enabled: true,
      gcTime: 0,
    }
  });
}

export function useGetTasksForBoard(questId: bigint) {
  const { chain } = useAccount();
  const QuestWebAddress = contractAddress.QuestWeb[chain?.name as keyof typeof contractAddress.QuestWeb] as `0x${string}`;
  return useReadContract<typeof abi, "getTasksForBoard", TaskView[]>({
    address: QuestWebAddress,
    abi,
    functionName: "getTasksForBoard",
    args: [questId],
  });
}
export function useIsBoardMember(questId: string, address?: `0x${string}`) {
  const { chain } = useAccount();
  const QuestWebAddress = contractAddress.QuestWeb[chain?.name as keyof typeof contractAddress.QuestWeb] as `0x${string}`;
  return useReadContract<typeof abi, "isBoardMember", [boolean]>({
    address: QuestWebAddress,
    abi,
    functionName: "isBoardMember",
    args: [questId, address],
  });
}

// Get all sections the user has joined
export function useGetBoardsByMember(address?: `0x${string}`) {
  const { chain } = useAccount();
  const QuestWebAddress = contractAddress.QuestWeb[chain?.name as keyof typeof contractAddress.QuestWeb] as `0x${string}`;

  return useReadContract<typeof abi, "getBoardsByMember", BoardView[]>({
    address: QuestWebAddress,
    abi,
    functionName: "getBoardsByMember",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });
}

// Set profile
export function useSetProfile() {
  const { chain } = useAccount();
  const { toast } = useToast();
  const { writeContractAsync } = useWriteContract();
  const userProfileAddress = getUserProfileAddress(chain);

  return async ({
    nickname,
    avatar,
    socialAccount,
    signature
  }: {
    nickname: string;
    avatar: string;
    socialAccount: string;
    signature: `0x${string}`;
  }) => {
    try {
      toast({
        title: "Notification",
        description: "Please confirm the transaction in your wallet.",
      });

      console.log("setProfile", nickname, avatar, socialAccount, signature, userProfileAddress);


      const hash = await writeContractAsync({
        address: userProfileAddress,
        abi: userProfileAbi,
        functionName: "setProfile",
        args: [nickname, avatar, socialAccount, signature],
      });
      return { hash };
    } catch (error) {
      console.error("Profile update error:", error);
      throw error;
    }
  };
}

// Get profile
export function useGetProfile(address?: `0x${string}`) {
  const { chain } = useAccount();
  const userProfileAddress = getUserProfileAddress(chain);

  return useReadContract<typeof userProfileAbi, "getProfile", [string, string, string, bigint]>({
    address: userProfileAddress,
    abi: userProfileAbi,
    functionName: "getProfile",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });
}

// Batch retrieve profiles
export function useGetProfiles(addresses?: `0x${string}`[]) {
  const { chain } = useAccount();
  const userProfileAddress = getUserProfileAddress(chain);

  return useReadContract<typeof userProfileAbi, "getProfiles", [string[], string[], string[], bigint[], boolean[]]>({
    address: userProfileAddress,
    abi: userProfileAbi,
    functionName: "getProfiles",
    args: addresses ? [addresses] : undefined,
    query: {
      enabled: !!addresses?.length,
    }
  });
}

// Get all users
export function useGetAllUsers() {
  const { chain } = useAccount();
  const userProfileAddress = getUserProfileAddress(chain);

  return useReadContract<typeof userProfileAbi, "getAllUsers", `0x${string}`[]>({
    address: userProfileAddress,
    abi: userProfileAbi,
    functionName: "getAllUsers",
  });
}

// Update user profile
export function useUpdateProfile() {
  const { writeContractAsync } = useWriteContract();
  const { toast } = useToast();
  const { chain } = useAccount();
  const userProfileAddress = getUserProfileAddress(chain);

  const updateProfile = async (args: [string, string, string, `0x${string}`]) => {
    try {
      toast({
        title: "Notification",
        description: "Please confirm the transaction in your wallet.",
      });

      console.log("userProfileAddress", userProfileAddress);
      console.log("setProfile args:", args);

      const hash = await writeContractAsync({
        address: userProfileAddress,
        abi: userProfileAbi,
        functionName: "setProfile",
        args,
      });

      return hash;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    }
  };

  return updateProfile;
}
