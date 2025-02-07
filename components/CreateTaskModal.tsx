"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CreateTaskParams, BoardConfig, TaskConfig, SUPPORTED_NETWORKS, COMMON_TOKENS } from '@/types/quest';
import { Calendar } from "@/components/ui/calendar";
import { add, format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useWaitForTransactionReceipt } from "wagmi";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { toDate } from '@/lib/date';

interface CreateTaskModalProps {
  boardConfig: BoardConfig;
  tokenSymbol: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskParams) => Promise<any>;
  onConfirmed?: () => void;
  initialData?: {
    taskBasicInfo: {
      name: string;
      description: string;
    };
    taskDetails: {
      deadline: Date | number;
      maxCompletions: number;
      rewardAmount: number;
      allowSelfCheck?: boolean;
      questId?: string;
    };
    taskConfig: TaskConfig;
    selectedTypes: string[];
  };
  mode?: 'create' | 'update';
}

const AI_REVIEWABLE_TYPES = [
  'Plain Text',
  'Image',
  'Github Pull Request',
  'Contract Verification'
];

interface TaskDetailsState {
  deadline: Date;
  maxCompletions: number;
  rewardAmount: number;
}

// Add type definitions
type PaymentChain = 'ETH' | 'SOL' | 'MINA';

interface SupportedNetwork {
  name: string;
  id: string;
  nativeCurrency: string;
}

interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  isNative?: boolean;
  addresses?: Record<string, string>;
}

interface NetworkToken {
  symbol: string;
  name: string;
  decimals: number;
  isNative?: boolean;
  addresses?: Record<string, string>;
}

// Add default payment chain
const DEFAULT_PAYMENT_CHAIN = 'ETH' as PaymentChain;

// Type assertion functions with type safety
const getSupportedNetworks = (chain: PaymentChain): SupportedNetwork[] => {
  const networks = SUPPORTED_NETWORKS[chain];
  return networks.map(network => ({
    name: network.name,
    id: network.id,
    nativeCurrency: network.nativeCurrency
  }));
};

const getTokens = (chain: PaymentChain): TokenInfo[] => {
  const tokens = COMMON_TOKENS[chain];
  return tokens.map(token => {
    const baseToken = {
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
    } as NetworkToken;

    // Only add optional properties if they exist
    if ('isNative' in token) {
      baseToken.isNative = token.isNative;
    }
    if ('addresses' in token) {
      baseToken.addresses = token.addresses;
    }

    return baseToken;
  });
};

// Helper function to safely check token properties
const isNativeToken = (token: TokenInfo): boolean => {
  return !!token.isNative;
};

const getTokenAddress = (token: TokenInfo, network: string): string | null => {
  if (!token.addresses || !(network in token.addresses)) return null;
  return token.addresses[network];
};

export default function CreateTaskModal({
  boardConfig,
  tokenSymbol,
  isOpen,
  onClose,
  onSubmit,
  onConfirmed,
  initialData,
  mode = 'create',
}: CreateTaskModalProps) {
  const [step, setStep] = useState(1);
  const [taskConfig, setTaskConfig] = useState<TaskConfig>({
    taskType: [],
    aiReview: false,
    aiReviewPrompt: '',
    XRetweetId: '',
    DiscordChannelId: '',
    DiscordInviteLink: '',
    paymentChain: 'ETH' as PaymentChain,
    paymentNetwork: SUPPORTED_NETWORKS['ETH'][0].id,
    paymentToken: 'NATIVE',
    paymentTokenSymbol: SUPPORTED_NETWORKS['ETH'][0].nativeCurrency,
    paymentTokenDecimals: COMMON_TOKENS['ETH'][0].decimals,
  });
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [taskBasicInfo, setTaskBasicInfo] = useState({
    name: '',
    description: '',
  });
  const [taskDetails, setTaskDetails] = useState<TaskDetailsState>({
    deadline: initialData?.taskDetails.deadline
      ? new Date(Number(initialData.taskDetails.deadline) / 1000)
      : add(new Date(), { days: 7 }),
    maxCompletions: initialData?.taskDetails.maxCompletions || 1,
    rewardAmount: initialData?.taskDetails.rewardAmount || 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | undefined>();
  const { toast } = useToast();
  const [customTokenAddress, setCustomTokenAddress] = useState<string>("");
  const [isCustomToken, setIsCustomToken] = useState(false);

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: transactionError
  } = useWaitForTransactionReceipt({
    hash: transactionHash,
  });

  const resetAllStates = () => {
    setStep(1);
    setTaskConfig({
      taskType: [],
      aiReview: false,
      aiReviewPrompt: '',
      XRetweetId: '',
      DiscordChannelId: '',
      DiscordInviteLink: '',
      paymentChain: 'ETH' as PaymentChain,
      paymentNetwork: SUPPORTED_NETWORKS['ETH'][0].id,
      paymentToken: 'NATIVE',
      paymentTokenSymbol: SUPPORTED_NETWORKS['ETH'][0].nativeCurrency,
      paymentTokenDecimals: COMMON_TOKENS['ETH'][0].decimals,
    });
    setSelectedTypes([]);
    setOpen(false);
    setTaskBasicInfo({
      name: '',
      description: '',
    });
    setTaskDetails({
      deadline: add(new Date(), { days: 7 }),
      maxCompletions: 1,
      rewardAmount: 0,
    });
    setIsSubmitting(false);
    setTransactionHash(undefined);
    setCustomTokenAddress("");
    setIsCustomToken(false);
  };

  const handleClose = () => {
    resetAllStates();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      if (mode === 'update' && initialData) {
        // Set basic info
        setTaskBasicInfo({
          name: initialData.taskBasicInfo.name,
          description: initialData.taskBasicInfo.description,
        });

        // Set task details
        setTaskDetails({
          deadline: new Date(initialData.taskDetails.deadline),
          maxCompletions: initialData.taskDetails.maxCompletions,
          rewardAmount: initialData.taskDetails.rewardAmount,
        });

        // Parse and set task config
        let parsedConfig;
        try {
          if (typeof initialData.taskConfig === 'string') {
            // First parse
            const firstParse = JSON.parse(initialData.taskConfig);
            // Check if we need a second parse
            if (typeof firstParse === 'string') {
              try {
                parsedConfig = JSON.parse(firstParse);
              } catch (e) {
                console.error('Error parsing inner task config:', e);
                parsedConfig = firstParse;
              }
            } else {
              parsedConfig = firstParse;
            }
          } else {
            parsedConfig = initialData.taskConfig;
          }
        } catch (error) {
          console.error('Error parsing task config:', error);
          parsedConfig = {};
        }

        // Set task config
        setTaskConfig({
          taskType: parsedConfig.taskType || [],
          aiReview: parsedConfig.aiReview || false,
          aiReviewPrompt: parsedConfig.aiReviewPrompt || '',
          contractNetwork: parsedConfig.contractNetwork || '',
          XPostContent: parsedConfig.XPostContent || '',
          XFollowUsername: parsedConfig.XFollowUsername || '',
          XLikeId: parsedConfig.XLikeId || '',
          XRetweetId: parsedConfig.XRetweetId || '',
          DiscordChannelId: parsedConfig.DiscordChannelId || '',
          DiscordInviteLink: parsedConfig.DiscordInviteLink || '',
          paymentChain: parsedConfig.paymentChain || DEFAULT_PAYMENT_CHAIN,
          paymentNetwork: parsedConfig.paymentNetwork || SUPPORTED_NETWORKS[DEFAULT_PAYMENT_CHAIN][0].id,
          paymentToken: parsedConfig.paymentToken || 'NATIVE',
          paymentTokenSymbol: parsedConfig.paymentTokenSymbol || SUPPORTED_NETWORKS[DEFAULT_PAYMENT_CHAIN][0].nativeCurrency,
          paymentTokenDecimals: parsedConfig.paymentTokenDecimals || COMMON_TOKENS[DEFAULT_PAYMENT_CHAIN][0].decimals,
        });

        // Set selected types
        setSelectedTypes(parsedConfig.taskType || []);
      } else {
        // Initialize with default values for create mode
        const networks = getSupportedNetworks(DEFAULT_PAYMENT_CHAIN);
        const tokens = getTokens(DEFAULT_PAYMENT_CHAIN);

        setTaskConfig({
          taskType: [],
          aiReview: false,
          aiReviewPrompt: '',
          contractNetwork: '',
          XPostContent: '',
          XFollowUsername: '',
          XLikeId: '',
          XRetweetId: '',
          DiscordChannelId: '',
          DiscordInviteLink: '',
          paymentChain: DEFAULT_PAYMENT_CHAIN,
          paymentNetwork: networks[0].id,
          paymentToken: 'NATIVE',
          paymentTokenSymbol: networks[0].nativeCurrency,
          paymentTokenDecimals: tokens[0].decimals,
        });
        setSelectedTypes([]);
        setTaskBasicInfo({
          name: '',
          description: '',
        });
        setTaskDetails({
          deadline: add(new Date(), { days: 7 }), // Default to 7 days from now
          maxCompletions: 1,
          rewardAmount: 0,
        });
      }
    } else {
      // Reset all states when modal closes
      resetAllStates();
    }
  }, [isOpen, mode, initialData]);

  useEffect(() => {
    if (isConfirming) {
      toast({
        title: "Processing",
        description: (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span>Waiting for transaction confirmation...</span>
          </div>
        ),
      });
    } else if (isConfirmed) {
      toast({
        title: "Success!",
        description: "Task created successfully.",
      });
      setTransactionHash(undefined);
      onConfirmed && onConfirmed();
      handleClose();
    } else if (transactionError) {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
      setTransactionHash(undefined);
      setIsSubmitting(false);
    }
  }, [isConfirming, isConfirmed, transactionError, onConfirmed, toast]);

  useEffect(() => {
    const sendAnnouncement = async () => {
      if (isConfirmed && boardConfig.channelId && taskBasicInfo.name && taskBasicInfo.description) {
        try {
          fetch('/api/discord-announcement', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              channelId: boardConfig.channelId,
              type: mode === 'create' ? 'task_created' : 'task_updated',
              data: {
                taskName: taskBasicInfo.name,
                taskDescription: taskBasicInfo.description,
                taskTypes: selectedTypes,
                taskConfig: taskConfig,
                deadline: taskDetails.deadline,
                maxCompletions: taskDetails.maxCompletions,
                rewardAmount: taskDetails.rewardAmount,
                tokenSymbol: tokenSymbol,
                aiReview: taskConfig.aiReview,
                aiReviewPrompt: taskConfig.aiReviewPrompt,
                socialRequirements: {
                  ...(taskConfig.XPostContent && { xPost: taskConfig.XPostContent }),
                  ...(taskConfig.XFollowUsername && { xFollow: taskConfig.XFollowUsername }),
                  ...(taskConfig.XLikeId && { xLike: taskConfig.XLikeId }),
                  ...(taskConfig.XRetweetId && { xRetweet: taskConfig.XRetweetId }),
                  ...(taskConfig.DiscordChannelId && {
                    discordServer: taskConfig.DiscordChannelId,
                    discordInvite: taskConfig.DiscordInviteLink
                  }),
                }
              }
            }),
          }).catch(error => {
            console.error('Failed to send announcement:', error);
          });
        } catch (error) {
          console.error('Failed to prepare announcement data:', error);
        }
      }
    };

    sendAnnouncement();
  }, [
    isConfirmed,
    boardConfig.channelId,
    taskBasicInfo,
    taskConfig,
    taskDetails,
    selectedTypes,
    mode,
    tokenSymbol
  ]);

  const taskTypes = [
    'Plain Text',
    'Image',
    'Github Pull Request',
    'Contract Verification',
    'X Post',
    'X Follow',
    'X Retweet',
    'X Like',
    'Join Discord'
  ];

  const handleTypeSelect = (type: string) => {
    setSelectedTypes(prev => {
      const newTypes = prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type];

      setTaskConfig(current => ({
        ...current,
        taskType: newTypes
      }));

      return newTypes;
    });
  };

  const hasAIReviewableType = selectedTypes.some(type =>
    AI_REVIEWABLE_TYPES.includes(type)
  );

  const shouldShowSelfCheck = selectedTypes.length > 0 &&
    (!hasAIReviewableType || (hasAIReviewableType && taskConfig.aiReview));

  useEffect(() => {
    if (!shouldShowSelfCheck) {
      setTaskDetails(prev => ({ ...prev, allowSelfCheck: false }));
    }
  }, [shouldShowSelfCheck]);

  const renderConfigFields = () => {
    return (
      <div className="space-y-4">
        {hasAIReviewableType && (
          <div className="space-y-4 border p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="aiReview"
                checked={taskConfig.aiReview || false}
                onCheckedChange={(checked) =>
                  setTaskConfig(prev => ({
                    ...prev,
                    aiReview: checked as boolean,
                  }))
                }
              />
              <label htmlFor="aiReview">Enable AI Review</label>
            </div>

            {taskConfig.aiReview && (
              <Textarea
                placeholder="AI Review Prompt (e.g., Check if the submission meets the following criteria...)"
                value={taskConfig.aiReviewPrompt || ''}
                onChange={(e) => setTaskConfig(prev => ({
                  ...prev,
                  aiReviewPrompt: e.target.value
                }))}
                className="mt-2"
              />
            )}
          </div>
        )}

        {selectedTypes.includes('Contract Verification') && (
          <div className="space-y-4">
            <Select
              value={taskConfig.contractNetwork || undefined}
              onValueChange={(value) => setTaskConfig(prev => ({
                ...prev,
                contractNetwork: value
              }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select Network" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Telos">Telos</SelectItem>
                <SelectItem value="Telos Testnet">Telos Testnet</SelectItem>
                <SelectItem value="Monad Devnet">Monad Devnet</SelectItem>
                <SelectItem value="opBNB">Op BNB</SelectItem>
                <SelectItem value="opBNB Testnet">Op BNB Testnet</SelectItem>
                <SelectItem value="BSC">BSC</SelectItem>
                <SelectItem value="BSC Testnet">BSC Testnet</SelectItem>
                <SelectItem value="Flow EVM">Flow EVM</SelectItem>
                <SelectItem value="Flow EVM Testnet">Flow EVM Testnet</SelectItem>
                <SelectItem value="Mantle">Mantle</SelectItem>
                <SelectItem value="Mantle Sepolia">Mantle Sepolia</SelectItem>
                <SelectItem value="Linea">Linea</SelectItem>
                <SelectItem value="Linea Sepolia">Linea Sepolia</SelectItem>
                <SelectItem value="Ethereum">Ethereum</SelectItem>
                <SelectItem value="Sepolia">Sepolia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedTypes.includes('X Post') && (
          <div className="space-y-2">
            <label htmlFor="xPostContent" className="text-sm font-medium">
              Required Post Content
            </label>
            <Input
              id="xPostContent"
              placeholder="Enter the required content for the post"
              value={taskConfig.XPostContent || ''}
              onChange={(e) => setTaskConfig(prev => ({
                ...prev,
                XPostContent: e.target.value
              }))}
            />
          </div>
        )}

        {selectedTypes.includes('X Follow') && (
          <div className="space-y-2">
            <label htmlFor="xFollowUsername" className="text-sm font-medium">
              X Username to Follow
            </label>
            <Input
              id="xFollowUsername"
              placeholder="Enter username without @ (e.g., elonmusk)"
              value={taskConfig.XFollowUsername || ''}
              onChange={(e) => setTaskConfig(prev => ({
                ...prev,
                XFollowUsername: e.target.value
              }))}
            />
          </div>
        )}

        {selectedTypes.includes('X Like') && (
          <div className="space-y-2">
            <label htmlFor="xLikeId" className="text-sm font-medium">
              X ID to Like
            </label>
            <div className="space-y-1">
              <Input
                id="xLikeId"
                placeholder="Enter the X ID (e.g., 1234567890)"
                value={taskConfig.XLikeId || ''}
                onChange={(e) => setTaskConfig(prev => ({
                  ...prev,
                  XLikeId: e.target.value
                }))}
              />
              <p className="text-xs text-muted-foreground">
                The X ID can be found in the X URL after /status/
              </p>
            </div>
          </div>
        )}

        {selectedTypes.includes('X Retweet') && (
          <div className="space-y-2">
            <label htmlFor="xRetweetId" className="text-sm font-medium">
              X ID to Retweet
            </label>
            <div className="space-y-1">
              <Input
                id="xRetweetId"
                placeholder="Enter the X ID (e.g., 1234567890)"
                value={taskConfig.XRetweetId || ''}
                onChange={(e) => setTaskConfig(prev => ({
                  ...prev,
                  XRetweetId: e.target.value
                }))}
              />
              <p className="text-xs text-muted-foreground">
                The X ID can be found in the X URL after /status/
              </p>
            </div>
          </div>
        )}

        {selectedTypes.includes('Join Discord') && (
          <div className="space-y-2">
            <label htmlFor="discordChannelId" className="text-sm font-medium">
              Discord Server Settings
            </label>
            <div className="space-y-4">
              <div className="space-y-1">
                <Input
                  id="discordChannelId"
                  placeholder="Enter the Discord server ID"
                  value={taskConfig.DiscordChannelId || ''}
                  onChange={(e) => setTaskConfig(prev => ({
                    ...prev,
                    DiscordChannelId: e.target.value
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Copy the Discord server ID from the url.
                </p>
              </div>

              <div className="space-y-1">
                <Input
                  id="discordInviteLink"
                  placeholder="Enter the Discord invite link"
                  value={taskConfig.DiscordInviteLink || ''}
                  onChange={(e) => setTaskConfig(prev => ({
                    ...prev,
                    DiscordInviteLink: e.target.value
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Create an invite link in Discord server settings
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Configuration */}
        <div className="space-y-4 border p-4 rounded-lg">
          <h4 className="font-medium">Payment Configuration</h4>

          {/* Chain Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Chain</label>
            <Select
              value={taskConfig.paymentChain}
              onValueChange={(value: 'ETH' | 'SOL' | 'MINA') => {
                setTaskConfig(prev => ({
                  ...prev,
                  paymentChain: value,
                  paymentNetwork: getSupportedNetworks(value)[0].id,
                  paymentToken: 'NATIVE',
                  paymentTokenSymbol: getSupportedNetworks(value)[0].nativeCurrency,
                  paymentTokenDecimals: getTokens(value)[0].decimals,
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment chain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ETH">Ethereum & EVM</SelectItem>
                <SelectItem value="SOL">Solana</SelectItem>
                <SelectItem value="MINA">Mina</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Network Selection */}
          {taskConfig.paymentChain && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Network</label>
              <Select
                value={taskConfig.paymentNetwork}
                onValueChange={(value) => {
                  setTaskConfig(prev => ({
                    ...prev,
                    paymentNetwork: value,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  {getSupportedNetworks(taskConfig.paymentChain).map((network) => (
                    <SelectItem key={network.id} value={network.id}>
                      {network.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Token Selection */}
          {taskConfig.paymentChain && taskConfig.paymentNetwork && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Token</label>
              <Select
                value={taskConfig.paymentToken}
                onValueChange={(value) => {
                  if (taskConfig.paymentChain && taskConfig.paymentNetwork) {
                    handleTokenSelection(value, taskConfig.paymentChain, taskConfig.paymentNetwork);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  {getTokens(taskConfig.paymentChain).map(renderTokenOption)}
                  <SelectItem value="CUSTOM">Custom Token</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {isCustomToken && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Custom Token Address</label>
              <Input
                placeholder="Enter token contract address"
                value={customTokenAddress}
                onChange={(e) => handleCustomTokenAddressChange(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (step === 1) {
      if (!taskBasicInfo.name || !taskBasicInfo.description || selectedTypes.length === 0) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Validate payment configuration
      if (!taskConfig.paymentChain || !taskConfig.paymentNetwork || !taskConfig.paymentToken) {
        toast({
          title: "Error",
          description: "Please complete the payment configuration",
          variant: "destructive",
        });
        return;
      }

      if (selectedTypes.includes('Join Discord') &&
          (!taskConfig.DiscordChannelId || !taskConfig.DiscordInviteLink)) {
        toast({
          title: "Error",
          description: "Please fill in all Discord server information",
          variant: "destructive",
        });
        return;
      }

      if (taskConfig.aiReview && !taskConfig.aiReviewPrompt) {
        toast({
          title: "Error",
          description: "Please provide an AI Review prompt",
          variant: "destructive",
        });
        return;
      }

      setStep(2);
      return;
    }

    if (!taskDetails.maxCompletions || !taskDetails.rewardAmount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const params: CreateTaskParams = {
        name: taskBasicInfo.name,
        description: taskBasicInfo.description,
        deadline: taskDetails.deadline,
        maxCompletions: Number(taskDetails.maxCompletions),
        rewardAmount: Number(taskDetails.rewardAmount),
        config: JSON.stringify(taskConfig),
        allowSelfCheck: false, // Set to false since we're removing this feature
      };

      const result = await onSubmit(params);
      if (result?.hash) {
        setTransactionHash(result.hash as `0x${string}`);
      }
      if (!result?.hash && onConfirmed) {
        onConfirmed();
      }
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTokenSelection = (value: string, chain: PaymentChain, network: string) => {
    if (value === 'CUSTOM') {
      setIsCustomToken(true);
      setTaskConfig(prev => ({
        ...prev,
        paymentToken: customTokenAddress || '',
        paymentTokenSymbol: 'CUSTOM',
        paymentTokenDecimals: 18,
      }));
    } else {
      setIsCustomToken(false);
      const selectedToken = getTokens(chain).find(token =>
        token.isNative ? value === 'NATIVE' : getTokenAddress(token, network) === value
      );
      if (selectedToken) {
        setTaskConfig(prev => ({
          ...prev,
          paymentToken: value,
          paymentTokenSymbol: selectedToken.symbol,
          paymentTokenDecimals: selectedToken.decimals,
        }));
      }
    }
  };

  const handleCustomTokenAddressChange = (address: string) => {
    setCustomTokenAddress(address);
    if (isCustomToken) {
      setTaskConfig(prev => ({
        ...prev,
        paymentToken: address,
      }));
    }
  };

  const renderTokenOption = (token: TokenInfo) => {
    const network = taskConfig.paymentNetwork || '';
    const value = token.isNative ? 'NATIVE' : getTokenAddress(token, network) || '';

    return (
      <SelectItem key={token.symbol} value={value}>
        {token.symbol} - {token.name}
      </SelectItem>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[60vw] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1
              ? `${mode === 'update' ? 'Update' : 'Create'} Task - Basic Info`
              : `${mode === 'update' ? 'Update' : 'Create'} Task - Details`}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? `Enter the basic task information and configuration`
              : `Set the task deadline, completions, and reward`}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4 pr-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Task Name</label>
              <Input
                placeholder="Enter task name"
                value={taskBasicInfo.name}
                onChange={(e) => setTaskBasicInfo(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Task Description</label>
              <Textarea
                placeholder="Enter task description"
                value={taskBasicInfo.description}
                onChange={(e) => setTaskBasicInfo(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Task Types</label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                  >
                    <div className="flex flex-wrap gap-1 items-center">
                      {selectedTypes.length === 0 ? (
                        "Select task types..."
                      ) : (
                        selectedTypes.map((type) => (
                          <Badge
                            key={type}
                            variant="secondary"
                            className="mr-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTypeSelect(type);
                            }}
                          >
                            {type}
                            <button
                              className="ml-1 hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTypeSelect(type);
                              }}
                            >
                              ×
                            </button>
                          </Badge>
                        ))
                      )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <div className="max-h-[200px] overflow-y-auto">
                    {taskTypes.map((type) => (
                      <div
                        key={type}
                        className={cn(
                          "flex items-center px-4 py-2 cursor-pointer hover:bg-accent",
                          selectedTypes.includes(type) && "bg-accent"
                        )}
                        onClick={() => handleTypeSelect(type)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedTypes.includes(type) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {type}
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {renderConfigFields()}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Deadline</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !taskDetails.deadline && "text-muted-foreground"
                    )}
                  >
                    {taskDetails.deadline ? (
                      format(Number(taskDetails.deadline), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={taskDetails.deadline}
                    onSelect={(date) =>
                      setTaskDetails(prev => ({
                        ...prev,
                        deadline: date || new Date()
                      }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Completions</label>
              <Input
                type="number"
                placeholder="Enter maximum number of completions"
                value={taskDetails.maxCompletions}
                onChange={(e) => setTaskDetails(prev => ({ ...prev, maxCompletions: parseInt(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reward Amount</label>
              <Input
                type="number"
                placeholder="Enter reward amount"
                value={taskDetails.rewardAmount}
                onChange={(e) => setTaskDetails(prev => ({ ...prev, rewardAmount: parseFloat(e.target.value) }))}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 2 && (
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              disabled={isSubmitting}
            >
              Back
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : step === 1 ? "Next" : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
