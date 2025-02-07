import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

    // Check if quest exists
    const quest = await prisma.quest.findUnique({
      where: { id: params.questId }
    });

    if (!quest) {
      return NextResponse.json(
        { error: "Quest not found" },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMembership = await prisma.questMember.findUnique({
      where: {
        questId_userId: {
          questId: params.questId,
          userId: session.user.id
        }
      }
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "Already a member of this quest" },
        { status: 400 }
      );
    }

    // Add user to quest members
    const member = await prisma.questMember.create({
      data: {
        questId: params.questId,
        userId: session.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          }
        }
      }
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error("Failed to join quest:", error);
    return NextResponse.json(
      { error: "Failed to join quest" },
      { status: 500 }
    );
  }
}