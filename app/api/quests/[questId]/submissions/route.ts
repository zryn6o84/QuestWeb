import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { questId: string } }
) {
  try {
    const submissions = await prisma.submission.findMany({
      where: {
        task: {
          questId: params.questId,
        },
      },
      include: {
        task: true,
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Failed to fetch submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { questId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { taskId, proof } = await request.json();

    const submission = await prisma.submission.create({
      data: {
        taskId,
        userId: session.user.id,
        content: proof,
        status: "pending",
      },
      include: {
        task: true,
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Failed to create submission:", error);
    return NextResponse.json(
      { error: "Failed to create submission" },
      { status: 500 }
    );
  }
}

// PUT /api/quests/[questId]/submissions/[submissionId]
export async function PUT(
  request: Request,
  { params }: { params: { questId: string; submissionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { submissionId } = params;
    const { status, reviewComment } = await request.json();

    // Check if user is a reviewer
    const task = await prisma.task.findFirst({
      where: {
        questId: params.questId,
        submissions: {
          some: {
            id: submissionId,
          },
        },
      },
      include: {
        reviewers: {
          where: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!task || task.reviewers.length === 0) {
      return NextResponse.json(
        { error: "Not authorized to review this submission" },
        { status: 403 }
      );
    }

    const submission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: status,
        reviewComment,
        reviewerId: session.user.id,
        reviewedAt: new Date(),
      },
      include: {
        task: true,
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Failed to update submission:", error);
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  }
}