import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { TaskService } from '@/services/task';
import { QuestService } from '@/services/quest';
import { Task } from '@prisma/client';

// GET /api/quests/[questId]/tasks/[taskId]
export async function GET(
  req: Request,
  { params }: { params: { questId: string; taskId: string } }
) {
  try {
    const quest = await QuestService.getQuestById(params.questId);
    if (!quest) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    const task = await TaskService.getTaskById(params.taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if task belongs to quest
    if (task.questId !== params.questId) {
      return NextResponse.json(
        { error: 'Task does not belong to this quest' },
        { status: 400 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

// PUT /api/quests/[questId]/tasks/[taskId]
export async function PUT(
  req: Request,
  { params }: { params: { questId: string; taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quest = await QuestService.getQuestById(params.questId);
    if (!quest) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    const task = await TaskService.getTaskById(params.taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if task belongs to quest
    if (task.questId !== params.questId) {
      return NextResponse.json(
        { error: 'Task does not belong to this quest' },
        { status: 400 }
      );
    }

    // Check if user is the task creator
    if (task.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the task creator can update the task' },
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
    } = body;

    const updatedTask = await TaskService.updateTask(params.taskId, {
      name,
      description,
      deadline: deadline ? new Date(deadline) : null,
      maxCompletions,
      rewardAmount: rewardAmount ? BigInt(rewardAmount) : undefined,
      config: config || undefined,
      allowSelfCheck,
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// POST /api/quests/[questId]/tasks/[taskId]/submit
export async function POST(
  req: Request,
  { params }: { params: { questId: string; taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quest = await QuestService.getQuestById(params.questId);
    if (!quest) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    const task = await TaskService.getTaskById(params.taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if task belongs to quest
    if (task.questId !== params.questId) {
      return NextResponse.json(
        { error: 'Task does not belong to this quest' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { proof } = body;

    if (!proof) {
      return NextResponse.json(
        { error: 'Proof is required' },
        { status: 400 }
      );
    }

    const submission = await TaskService.submitTask({
      taskId: params.taskId,
      submitterId: session.user.id,
      proof,
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.error('Error submitting task:', error);
    return NextResponse.json(
      { error: 'Failed to submit task' },
      { status: 500 }
    );
  }
}