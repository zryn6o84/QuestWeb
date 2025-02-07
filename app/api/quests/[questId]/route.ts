import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { QuestService } from '@/services/quest';
import { prisma } from '@/lib/prisma';

// GET /api/quests/[questId]
export async function GET(
  req: Request,
  { params }: { params: { questId: string } }
) {
  try {
    const quest = await prisma.quest.findUnique({
      where: { id: params.questId },
      include: {
        creator: true,
        tasks: {
          include: {
            creator: true,
            reviewers: {
              include: {
                user: true
              }
            },
            submissions: true
          }
        },
        members: {
          include: {
            user: true
          }
        }
      }
    });

    if (!quest) {
      return NextResponse.json(
        { error: "Quest not found" },
        { status: 404 }
      );
    }

    console.log('Quest data:', JSON.stringify(quest, null, 2));
    return NextResponse.json(quest);
  } catch (error) {
    console.error("Error fetching quest:", error);
    return NextResponse.json(
      { error: "Failed to fetch quest" },
      { status: 500 }
    );
  }
}

// PUT /api/quests/[questId]
export async function PUT(
  req: Request,
  { params }: { params: { questId: string } }
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

    // Check if user is the creator
    if (quest.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the creator can update the quest' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, description, img, config, closed } = body;

    const updatedQuest = await QuestService.updateQuest(params.questId, {
      name,
      description,
      img,
      config,
      closed,
    });

    return NextResponse.json(updatedQuest);
  } catch (error) {
    console.error('Error updating quest:', error);
    return NextResponse.json(
      { error: 'Failed to update quest' },
      { status: 500 }
    );
  }
}
