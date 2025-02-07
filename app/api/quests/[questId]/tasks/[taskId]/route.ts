import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Task } from "@/types/quest";

// DELETE /api/quests/[questId]/tasks/[taskId]
export async function DELETE(
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
        { error: "Only quest creator can delete tasks" },
        { status: 403 }
      );
    }

    await prisma.task.delete({
      where: {
        id: params.taskId,
        questId: params.questId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
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
        { error: "Only quest creator can update tasks" },
        { status: 403 }
      );
    }

    const data = await req.json();
    const task = await prisma.task.update({
      where: {
        id: params.taskId,
        questId: params.questId,
      },
      data: {
        name: data.name,
        description: data.description,
        deadline: new Date(data.deadline),
        maxCompletions: data.maxCompletions,
        rewardAmount: data.rewardAmount.toString(),
        config: data.config,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}