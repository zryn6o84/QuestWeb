import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { QuestService } from '@/services/quest';

// GET /api/user/quests
export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await QuestService.getUserQuests(session.user.id, page, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching user quests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user quests' },
      { status: 500 }
    );
  }
}