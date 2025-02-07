import { NextResponse } from 'next/server'
import { TaskService, UserProfileService } from '@/services/prisma'

interface RouteParams {
  params: {
    questId: string
  }
}

// GET /api/board/[questId]/tasks?chainTaskId={number}
export async function GET(request: Request, { params }: RouteParams) {
  const { searchParams } = new URL(request.url)
  const chainTaskId = searchParams.get('chainTaskId')
  const questId = parseInt(params.questId)

  try {
    if (chainTaskId) {
      // Get specific task
      const task = await TaskService.getTask(questId, parseInt(chainTaskId))
      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
      return NextResponse.json(task)
    } else {
      // Get all tasks for board
      const board = await prisma.board.findUnique({
        where: { id: questId },
        include: {
          tasks: {
            include: {
              reviewers: {
                include: {
                  user: true,
                },
              },
              submissions: {
                include: {
                  submittedBy: true,
                  reviewedByUser: true,
                },
              },
              createdBy: true,
            },
          },
        },
      })

      if (!board) {
        return NextResponse.json({ error: 'Board not found' }, { status: 404 })
      }

      return NextResponse.json(board.tasks)
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/board/[questId]/tasks
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json()
    const {
      chainTaskId,
      creator,
      name,
      description,
      deadline,
      maxCompletions,
      rewardAmount,
      config,
      allowSelfCheck,
    } = body
    const questId = parseInt(params.questId)

    if (!chainTaskId || !creator || !name || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get or create user profile
    const user = await UserProfileService.getProfileByAddress(creator)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const task = await TaskService.createTask({
      chainTaskId,
      questId,
      creatorId: user.id,
      name,
      description,
      deadline: deadline ? new Date(deadline) : undefined,
      maxCompletions,
      rewardAmount: BigInt(rewardAmount || 0),
      config: config || '{}',
      allowSelfCheck: allowSelfCheck || false,
    })

    return NextResponse.json(task)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/board/[questId]/tasks?chainTaskId={number}
export async function PUT(request: Request, { params }: RouteParams) {
  const { searchParams } = new URL(request.url)
  const chainTaskId = searchParams.get('chainTaskId')
  const questId = parseInt(params.questId)

  if (!chainTaskId) {
    return NextResponse.json({ error: 'Chain task ID is required' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const {
      name,
      description,
      deadline,
      maxCompletions,
      completed,
      cancelled,
      config,
      allowSelfCheck,
    } = body

    const task = await prisma.task.findFirst({
      where: {
        questId,
        chainTaskId: parseInt(chainTaskId),
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const updatedTask = await TaskService.updateTask(task.id, {
      name,
      description,
      deadline: deadline ? new Date(deadline) : undefined,
      maxCompletions,
      completed,
      cancelled,
      config,
      allowSelfCheck,
    })

    return NextResponse.json(updatedTask)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}