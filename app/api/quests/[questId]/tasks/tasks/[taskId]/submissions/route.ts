import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { SubmissionService, UserProfileService, prisma } from '@/services/prisma'

interface RouteParams {
  params: {
    questId: string
    taskId: string
  }
}

// POST /api/quests/[questId]/tasks/[taskId]/submissions
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { proof } = await request.json()

    if (!proof) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const submission = await SubmissionService.createSubmission({
      taskId: params.taskId,
      submitterId: session.user.id,
      proof,
    })

    return NextResponse.json(submission)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/quests/[questId]/tasks/[taskId]/submissions?submissionId={string}
export async function PUT(request: Request, { params }: RouteParams) {
  const { searchParams } = new URL(request.url)
  const submissionId = searchParams.get('submissionId')

  if (!submissionId) {
    return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 })
  }

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, reviewComment } = body

    const submission = await SubmissionService.updateSubmissionStatus(
      submissionId,
      {
        status,
        reviewComment,
        reviewerId: session.user.id,
        reviewedAt: new Date(),
      }
    )

    return NextResponse.json(submission)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/quests/[questId]/tasks/[taskId]/submissions?submitter={address}
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const submitter = searchParams.get('submitter')

    if (submitter) {
      // Get submission by submitter
      const user = await UserProfileService.getProfileByAddress(submitter)
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const submission = await SubmissionService.getSubmission(params.taskId, user.id)
      return NextResponse.json(submission)
    } else {
      // Get all submissions for task
      const task = await prisma.task.findUnique({
        where: { id: params.taskId },
        include: {
          submissions: {
            include: {
              submittedBy: true,
              reviewedBy: true,
            },
          },
        },
      })

      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }

      return NextResponse.json(task.submissions)
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}