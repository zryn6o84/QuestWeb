import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CreateTaskParams } from "@/types/quest";
import { QuestService } from "@/services/quest";
import { TaskService } from "@/services/task";

interface RouteParams {
  params: {
    questId: string;
  };
}

// POST /api/quests/[questId]/tasks
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quest = await QuestService.getQuestById(params.questId);

    if (!quest) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    // Check if user is the quest creator
    if (quest.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the quest creator can add tasks' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      description,
      deadline,
      maxCompletions,
      rewardAmount,
      config,
      allowSelfCheck,
      reviewerIds,
    } = body;

    // Validate required fields
    if (!name || !description || !maxCompletions || !rewardAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store config as a JSON object directly
    const task = await TaskService.createTask({
      questId: params.questId,
      creatorId: session.user.id,
      name,
      description,
      deadline: deadline ? new Date(deadline) : null,
      maxCompletions,
      rewardAmount: rewardAmount.toString(),
      config,
      allowSelfCheck: allowSelfCheck || false,
      reviewerIds,
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: { questId: string } }
) {
  try {
    const tasks = await prisma.task.findMany({
      where: { questId: params.questId },
      include: {
        creator: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            evmAddress: true,
          }
        },
        quest: true,
        reviewers: {
          include: {
            user: true
          }
        },
        submissions: true
      }
    });

    // Parse config for each task
    const tasksWithParsedConfig = tasks.map(task => {
      let parsedConfig = {};
      try {
        if (task.config) {
          const firstParse = JSON.parse(task.config);
          parsedConfig = typeof firstParse === 'string' ? JSON.parse(firstParse) : firstParse;
        }
      } catch (error) {
        console.error('Error parsing task config:', error);
      }

      return {
        ...task,
        config: parsedConfig
      };
    });

    return NextResponse.json(tasksWithParsedConfig);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// PUT /api/quests/[questId]/tasks?taskId={string}
export async function PUT(request: Request, { params }: RouteParams) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');

  if (!taskId) {
    return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      deadline,
      maxCompletions,
      rewardAmount,
      config,
      allowSelfCheck,
    } = body;

    const updatedTask = await TaskService.updateTask(taskId, {
      name,
      description,
      deadline: deadline ? new Date(deadline) : null,
      maxCompletions,
      rewardAmount: rewardAmount ? BigInt(rewardAmount) : undefined,
      config,
      allowSelfCheck,
    });

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}