import { NextResponse } from 'next/server'
import { ReviewerService, UserProfileService } from '@/services/prisma'

interface RouteParams {
  params: {
    questId: string
    taskId: string
  }
}

// POST /api/board/[questId]/tasks/[taskId]/reviewers
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { address } = await request.json()
    const taskId = parseInt(params.taskId)

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    // Get or create user profile
    const user = await UserProfileService.getProfileByAddress(address)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already a reviewer
    const isReviewer = await ReviewerService.isReviewer(taskId, user.id)
    if (isReviewer) {
      return NextResponse.json(
        { error: 'User is already a reviewer' },
        { status: 400 }
      )
    }

    const reviewer = await ReviewerService.addReviewer({
      taskId,
      userId: user.id,
    })

    return NextResponse.json(reviewer)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/board/[questId]/tasks/[taskId]/reviewers?address={address}
export async function GET(request: Request, { params }: RouteParams) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  const taskId = parseInt(params.taskId)

  try {
    if (address) {
      // Check if specific user is reviewer
      const user = await UserProfileService.getProfileByAddress(address)
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const isReviewer = await ReviewerService.isReviewer(taskId, user.id)
      return NextResponse.json({ isReviewer })
    } else {
      // Get all task reviewers
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          reviewers: {
            include: {
              user: true,
            },
          },
        },
      })

      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }

      return NextResponse.json(task.reviewers)
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}