"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useQuestDetail } from "@/hooks/useQuestData";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow, format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import TaskList from "@/components/TaskList";
import { Plus, UserPlus, MoreVertical } from "lucide-react";
import CreateTaskModal from "@/components/CreateTaskModal";
import { Task, CreateTaskParams, Quest, Member } from "@/types/quest";
import { TaskView, ModalConfigType, BoardConfig, SubmissionView, BoardDetailView, TaskConfig } from "@/types/types";
import { useToast } from "@/components/ui/use-toast";
import { formatToISOString, toDate } from "@/lib/date";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import QuestForm from "@/components/QuestForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AddReviewerModal from "@/components/AddReviewerModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MemberSubmissionTable from "@/components/MemberSubmissionTable";
import { Chain } from "viem";

interface QuestData extends Quest {
  members: Member[];
  creator: {
    id: string;
    name: string | null;
    email: string | null;
    nickname: string | null;
    avatar: string | null;
    image: string | null;
  };
  tasks: Array<Task & {
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
  }>;
}

export default function QuestDetailPage() {
  const params = useParams();
  const questId = params.questId as string;
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("tasks");
  const [members, setMembers] = useState<Member[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionView[]>([]);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();
  const [isAddReviewerModalOpen, setIsAddReviewerModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isUpdateTaskModalOpen, setIsUpdateTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskView | null>(null);
  const [initialTaskData, setInitialTaskData] = useState<any>(null);
  const chain: Chain = {
    id: 1,
    name: "Ethereum",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: ["https://eth.llamarpc.com"] } },
  };

  const { data: quest, isLoading, refetch } = useQuestDetail<BoardDetailView>(questId);
  const isCreator = session?.user?.id === quest?.creator.id;
  const isMember = quest?.members?.some(member => member.userId === session?.user?.id) || false;

  useEffect(() => {
    const fetchData = async () => {
      if (questId) {
        try {
          // Fetch members
          const membersRes = await fetch(`/api/quests/${questId}/members`);
          const membersData = await membersRes.json();
          setMembers(membersData);

          // Fetch submissions
          const submissionsRes = await fetch(`/api/quests/${questId}/submissions`);
          const submissionsData = await submissionsRes.json();
          setSubmissions(submissionsData);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    };

    fetchData();
  }, [questId]);

  if (isLoading) {
    return <QuestDetailSkeleton />;
  }

  if (!quest) {
    return <div>Quest not found</div>;
  }

  // Convert Task[] to TaskView[]
  const taskViews: TaskView[] = quest?.tasks?.map(task => {
    // Parse config - handle double JSON strings
    let parsedConfig: TaskConfig = {
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
      paymentChain: 'ETH',
      paymentNetwork: '',
      paymentToken: 'NATIVE',
      paymentTokenSymbol: 'ETH',
      paymentTokenDecimals: 18
    };

    try {
      if (typeof task.config === 'string') {
        // First parse the outer JSON string
        const firstParse = JSON.parse(task.config);
        // Then parse the inner JSON string if it's still a string
        const configObj = typeof firstParse === 'string' ? JSON.parse(firstParse) : firstParse;

        // Safely assign parsed values to maintain type safety
        parsedConfig = {
          taskType: Array.isArray(configObj.taskType) ? configObj.taskType : [],
          aiReview: Boolean(configObj.aiReview),
          aiReviewPrompt: configObj.aiReviewPrompt || '',
          contractNetwork: configObj.contractNetwork || '',
          XPostContent: configObj.XPostContent || '',
          XFollowUsername: configObj.XFollowUsername || '',
          XLikeId: configObj.XLikeId || '',
          XRetweetId: configObj.XRetweetId || '',
          DiscordChannelId: configObj.DiscordChannelId || '',
          DiscordInviteLink: configObj.DiscordInviteLink || '',
          paymentChain: (configObj.paymentChain as 'ETH' | 'SOL' | 'MINA') || 'ETH',
          paymentNetwork: configObj.paymentNetwork || '',
          paymentToken: configObj.paymentToken || 'NATIVE',
          paymentTokenSymbol: configObj.paymentTokenSymbol || 'ETH',
          paymentTokenDecimals: Number(configObj.paymentTokenDecimals) || 18
        };
      }
    } catch (error) {
      console.error('Error parsing task config:', error);
    }

    // Create TaskView object
    const taskView: TaskView = {
      id: task.id.toString(),
      questId: questId,
      name: task.name,
      description: task.description,
      deadline: task.deadline ? formatToISOString(task.deadline) : formatToISOString(new Date()),
      maxCompletions: Number(task.maxCompletions),
      rewardAmount: task.rewardAmount.toString(),
      config: parsedConfig,
      numCompletions: Number(task.numCompletions || 0),
      completed: Boolean(task.completed),
      cancelled: Boolean(task.cancelled),
      createdAt: formatToISOString(task.createdAt),
      updatedAt: formatToISOString(task.updatedAt),
      creatorId: task.creator.id.toString(),
      creator: task.creator,
      reviewers: task.reviewers || [],
      submissions: task.submissions || []
    };

    return taskView;
  }) || [];

  // Parse board config
  let boardConfig: BoardConfig = {
    channelId: '',
    taskTypes: [],
    reviewerReward: '0',
    minStake: '0',
    tokenAddress: '',
    tokenSymbol: '',
    tokenDecimals: 18
  };

  try {
    if (typeof quest.config === 'string') {
      // First parse the outer JSON string
      const firstParse = JSON.parse(quest.config);
      // Then parse the inner JSON string if it's still a string
      const configObj = typeof firstParse === 'string' ? JSON.parse(firstParse) : firstParse;

      // Safely assign parsed values
      boardConfig = {
        channelId: configObj.channelId || '',
        taskTypes: Array.isArray(configObj.taskTypes) ? configObj.taskTypes : [],
        reviewerReward: configObj.reviewerReward || '0',
        minStake: configObj.minStake || '0',
        tokenAddress: configObj.tokenAddress || '',
        tokenSymbol: configObj.tokenSymbol || '',
        tokenDecimals: Number(configObj.tokenDecimals) || 18
      };
    }
  } catch (error) {
    console.error('Error parsing board config:', error);
  }

  // 处理用户资料
  const userProfiles = quest?.members?.reduce<Record<string, { nickname: string; avatar: string }>>((acc, member) => {
    if (!member.user) return acc;
    return {
      ...acc,
      [member.userId.toString()]: {
        nickname: member.user.nickname || "Anonymous",
        avatar: member.user.avatar || "/default-avatar.png"
      }
    };
  }, {}) || {};

  // 添加任务创建者的资料
  quest?.tasks?.forEach(task => {
    if (!task.creator) return;
    userProfiles[task.creatorId.toString()] = {
      nickname: task.creator.nickname || "Anonymous",
      avatar: task.creator.avatar || "/default-avatar.png"
    };
  });

  // 添加任务审核者的资料
  quest?.tasks?.forEach(task => {
    task.reviewers?.forEach(reviewer => {
      if (!reviewer.user) return;
      userProfiles[reviewer.userId.toString()] = {
        nickname: reviewer.user.nickname || "Anonymous",
        avatar: reviewer.user.avatar || "/default-avatar.png"
      };
    });
  });

  // 添加 Quest 创建者的资料
  if (quest.creator) {
    userProfiles[quest.creatorId.toString()] = {
      nickname: quest.creator.nickname || "Anonymous",
      avatar: quest.creator.avatar || "/default-avatar.png"
    };
  }

  console.log('Tasks:', quest?.tasks);
  console.log('UserProfiles after mapping:', userProfiles);

  const handleJoinQuest = async () => {
    try {
      const response = await fetch(`/api/quests/${questId}/join`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join quest');
      }

      await refetch();
      toast({
        title: "Success",
        description: "Successfully joined the quest",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleOpenModal = (type: keyof ModalConfigType, taskId?: string) => {
    // TODO: Implement modal handling
    console.log('Opening modal:', type, taskId);
  };

  const handleSubmitProof = (taskId: string) => {
    // TODO: Implement proof submission
    console.log('Submitting proof for task:', taskId);
  };

  const handleOpenAddReviewerModal = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsAddReviewerModalOpen(true);
  };

  const handleAddReviewers = async (emails: string[]) => {
    if (!selectedTaskId) return;

    try {
      const response = await fetch(`/api/quests/${questId}/tasks/${selectedTaskId}/reviewers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add reviewers');
      }

      await refetch();
      toast({
        title: "Success",
        description: "Reviewers added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleOpenUpdateTaskModal = (taskId: string) => {
    const task = quest?.tasks?.find(t => t.id === taskId);
    if (task) {
      // Parse the task config if it's a string
      const parsedConfig = typeof task.config === 'string' ? JSON.parse(task.config) : task.config;

      // Format the initial data
      const initialData = {
        taskBasicInfo: {
          name: task.name,
          description: task.description,
        },
        taskDetails: {
          deadline: new Date(task.deadline),
          maxCompletions: task.maxCompletions,
          rewardAmount: Number(task.rewardAmount),
          questId: task.questId,
        },
        taskConfig: parsedConfig,
        selectedTypes: parsedConfig.taskType || [],
      };

      setSelectedTask(task);
      setInitialTaskData(initialData);
      setIsUpdateTaskModalOpen(true);
    }
  };

  const handleUpdateTask = async (taskId: string) => {
    const task = quest?.tasks?.find(t => t.id.toString() === taskId);
    if (!task) return;

    try {
      const response = await fetch(`/api/quests/${questId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: task.name,
          description: task.description,
          deadline: task.deadline ? formatToISOString(task.deadline) : undefined,
          maxCompletions: task.maxCompletions,
          rewardAmount: task.rewardAmount.toString(),
          config: typeof task.config === 'string' ? task.config : JSON.stringify(task.config)
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update task');
      }

      await refetch();
      setIsUpdateTaskModalOpen(false);
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCancelTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/quests/${questId}/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete task');
      }

      await refetch();
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateTask = async (data: CreateTaskParams) => {
    try {
      const response = await fetch(`/api/quests/${questId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create task');
      }

      await refetch();
      setIsCreateTaskModalOpen(false);
      toast({
        title: "Success",
        description: "Task created successfully",
      });

      return {};
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const handleCloseQuest = async () => {
    try {
      await fetch(`/api/quests?id=${questId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ closed: true }),
      });
      refetch();
    } catch (error) {
      console.error('Failed to close quest:', error);
    }
  };

  const handleEditQuest = async (data: Partial<Quest>) => {
    try {
      const response = await fetch(`/api/quests/${questId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update quest');
      }

      await refetch();
      setIsEditModalOpen(false);
      toast({
        title: "Success",
        description: "Quest updated successfully",
      });

      return await response.json();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Quest Header with Image */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Quest Image */}
        <div className="w-full md:w-1/3">
          <div className="aspect-video rounded-lg overflow-hidden">
            <img
              src={quest.img || "/placeholder.png"}
              alt={quest.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Quest Info */}
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{quest.name}</h1>
              <p className="text-muted-foreground">{quest.description}</p>
            </div>

            <div className="flex gap-2">
              {!isCreator && !isMember && !quest.closed && (
                <Button onClick={handleJoinQuest}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Join Quest
                </Button>
              )}
                  {isCreator && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                      Edit Quest
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCloseQuest}>
                      Close Quest
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {quest.closed && (
                <Button variant="outline" disabled>
                  Closed
                    </Button>
                  )}
                </div>
          </div>

          {/* Creator info */}
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={quest.creator?.avatar || undefined} />
              <AvatarFallback>
                {quest.creator?.nickname?.slice(0, 2).toUpperCase() || "??"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{quest.creator?.nickname || "Anonymous"}</p>
              <p className="text-sm text-muted-foreground">
                Created {formatDistanceToNow(toDate(quest.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="tasks" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Tasks</h2>
            {isCreator && !quest.closed && (
              <Button onClick={() => setIsCreateTaskModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
              )}
            </div>
            <TaskList
            questId={questId}
            tasks={quest.tasks}
            boardConfig={boardConfig}
            userTaskStatuses={quest.userTaskStatuses}
            onTaskSelect={() => {}}
            onOpenSubmitModal={handleSubmitProof}
            onOpenAddReviewerModal={handleOpenAddReviewerModal}
            onOpenUpdateTaskModal={handleOpenUpdateTaskModal}
            onCancelTask={handleCancelTask}
              refetch={refetch}
              userProfiles={userProfiles}
            isCreator={isCreator}
              isMember={isMember}
              chain={chain}
            onRefresh={refetch}
            isWalletConnected={!!session?.user}
            />
          </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <div className="rounded-lg border bg-card">
            <div className="p-4">
              <h3 className="text-lg font-semibold">Members</h3>
              <div className="mt-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Member</th>
                      <th className="text-left p-2">Joined At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id} className="border-b">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.user?.avatar || undefined} />
                              <AvatarFallback>
                                {member.user?.nickname?.slice(0, 2).toUpperCase() || "??"}
                              </AvatarFallback>
                            </Avatar>
                            <span>{member.user?.nickname || "Anonymous"}</span>
                          </div>
                        </td>
                        <td className="p-2">
                          {format(new Date(member.createdAt), "PPp")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <div className="rounded-lg border bg-card">
            <div className="p-4">
              <h3 className="text-lg font-semibold">Submissions</h3>
            <MemberSubmissionTable
                questId={questId}
                tasks={taskViews}
                submissions={submissions}
              userProfiles={userProfiles}
                onRefresh={refetch}
            />
            </div>
          </div>
          </TabsContent>
        </Tabs>

      {/* Edit Quest Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <QuestForm
            mode="update"
            onSubmit={handleEditQuest}
            initialData={{
              name: quest.name,
              description: quest.description,
              img: quest.img || "",
              config: quest.config,
            }}
            isDialog={true}
          />
        </DialogContent>
      </Dialog>

      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        onSubmit={handleCreateTask}
        onConfirmed={() => refetch()}
        boardConfig={boardConfig}
        mode="create"
        tokenSymbol={boardConfig.tokenSymbol || "ETH"}
      />

      <AddReviewerModal
        isOpen={isAddReviewerModalOpen}
        onClose={() => setIsAddReviewerModalOpen(false)}
        onSubmit={handleAddReviewers}
      />

      <CreateTaskModal
        isOpen={isUpdateTaskModalOpen}
        onClose={() => setIsUpdateTaskModalOpen(false)}
        onSubmit={handleUpdateTask}
        onConfirmed={() => refetch()}
        boardConfig={boardConfig}
                mode="update"
        tokenSymbol={boardConfig.tokenSymbol || "ETH"}
        initialData={initialTaskData}
      />
    </div>
  );
}

function QuestDetailSkeleton() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3">
          <Skeleton className="aspect-video w-full" />
              </div>
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-20 w-full" />
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
            </div>
          </div>
    </div>
  );
}