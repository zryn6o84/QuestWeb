import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { TaskService } from '@/services/task'
import { QuestService } from '@/services/quest'

interface RouteParams {
  params: {
    questId: string
  }
}

// GET /api/quests/[questId]/tasks
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const quest = await QuestService.getQuestById(params.questId)

    if (!quest) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 })
    }

    return NextResponse.json(quest.tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST /api/quests/[questId]/tasks
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const quest = await QuestService.getQuestById(params.questId)

    if (!quest) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 })
    }

    // Check if user is the quest creator
    if (quest.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the quest creator can add tasks' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const {
      name,
      description,
      deadline,
      maxCompletions,
      rewardAmount,
      config,
      allowSelfCheck,
      reviewerIds,
    } = body

    // Validate required fields
    if (!name || !description || !maxCompletions || !rewardAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const task = await TaskService.createTask({
      questId: params.questId,
      creatorId: session.user.id,
      name,
      description,
      deadline: deadline ? new Date(deadline) : null,
      maxCompletions,
      rewardAmount: BigInt(rewardAmount),
      config: config || '{}',
      allowSelfCheck: allowSelfCheck || false,
      reviewerIds,
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

// PUT /api/quests/[questId]/tasks?taskId={string}
export async function PUT(request: Request, { params }: RouteParams) {
  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('taskId')

  if (!taskId) {
    return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
  }

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      deadline,
      maxCompletions,
      rewardAmount,
      config,
      allowSelfCheck,
    } = body

    const updatedTask = await TaskService.updateTask(taskId, {
      name,
      description,
      deadline: deadline ? new Date(deadline) : null,
      maxCompletions,
      rewardAmount: rewardAmount ? BigInt(rewardAmount) : undefined,
      config: config || undefined,
      allowSelfCheck,
    })

    return NextResponse.json(updatedTask)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}