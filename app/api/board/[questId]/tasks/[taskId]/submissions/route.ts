import { NextResponse } from 'next/server'
import { SubmissionService, UserProfileService } from '@/services/prisma'

interface RouteParams {
  params: {
    questId: string
    taskId: string
  }
}

// POST /api/board/[questId]/tasks/[taskId]/submissions
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { submitter, proof } = await request.json()
    const taskId = parseInt(params.taskId)

    if (!submitter || !proof) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get or create user profile
    const user = await UserProfileService.getProfileByAddress(submitter)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const submission = await SubmissionService.createSubmission({
      taskId,
      submitterId: user.id,
      proof,
    })

    return NextResponse.json(submission)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/board/[questId]/tasks/[taskId]/submissions?submissionId={number}
export async function PUT(request: Request, { params }: RouteParams) {
  const { searchParams } = new URL(request.url)
  const submissionId = searchParams.get('submissionId')

  if (!submissionId) {
    return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { status, reviewComment, reviewedBy } = body

    // Get reviewer's user profile
    let reviewerId: number | undefined
    if (reviewedBy) {
      const reviewer = await UserProfileService.getProfileByAddress(reviewedBy)
      if (!reviewer) {
        return NextResponse.json({ error: 'Reviewer not found' }, { status: 404 })
      }
      reviewerId = reviewer.id
    }

    const submission = await SubmissionService.updateSubmissionStatus(
      parseInt(submissionId),
      {
        status,
        reviewComment,
        reviewerId,
        reviewedAt: new Date(),
      }
    )

    return NextResponse.json(submission)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/board/[questId]/tasks/[taskId]/submissions?submitter={address}
export async function GET(request: Request, { params }: RouteParams) {
  const { searchParams } = new URL(request.url)
  const submitter = searchParams.get('submitter')
  const taskId = parseInt(params.taskId)

  try {
    if (submitter) {
      // Get submission by submitter
      const user = await UserProfileService.getProfileByAddress(submitter)
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const submission = await SubmissionService.getSubmission(taskId, user.id)
      return NextResponse.json(submission)
    } else {
      // Get all submissions for task
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          submissions: {
            include: {
              submittedBy: true,
              reviewedByUser: true,
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