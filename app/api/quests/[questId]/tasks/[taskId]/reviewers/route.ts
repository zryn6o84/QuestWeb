import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { questId: string; taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const quest = await prisma.quest.findUnique({
      where: { id: params.questId },
      select: {
        creatorId: true,
        closed: true,
      },
    });

    if (!quest) {
      return NextResponse.json(
        { error: "Quest not found" },
        { status: 404 }
      );
    }

    if (quest.closed) {
      return NextResponse.json(
        { error: "Cannot modify tasks in a closed quest" },
        { status: 400 }
      );
    }

    if (quest.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Only quest creator can add reviewers" },
        { status: 403 }
      );
    }

    const { emails } = await req.json();

    // 查找用户
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: emails,
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (users.length === 0) {
      return NextResponse.json(
        { error: "No valid users found with the provided emails" },
        { status: 400 }
      );
    }

    // 添加审核人员
    const reviewers = await Promise.all(
      users.map(user =>
        prisma.taskReviewer.create({
          data: {
            taskId: params.taskId,
            userId: user.id,
          },
          include: {
            user: true,
          },
        })
      )
    );

    return NextResponse.json(reviewers);
  } catch (error) {
    console.error("Error adding reviewers:", error);
    return NextResponse.json(
      { error: "Failed to add reviewers" },
      { status: 500 }
    );
  }
}