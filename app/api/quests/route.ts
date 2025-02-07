import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { QuestService } from '@/services/quest'
import prisma from '@/lib/prisma'
import { CreateBoardParams } from '@/types/types'

// GET /api/quests
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const closed = searchParams.get('closed') === 'true'

    const result = await QuestService.getQuests(page, limit, { closed })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching quests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quests' },
      { status: 500 }
    )
  }
}

// POST /api/quests
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.json()

    // Validate required fields
    if (!data.name || !data.description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create quest
    const quest = await QuestService.createQuest({
      name: data.name,
      description: data.description,
      img: data.img,
      config: data.config,
      creatorId: session.user.id,
    })

    return NextResponse.json(quest)
  } catch (error) {
    console.error('Error creating quest:', error)
    return NextResponse.json(
      { error: 'Failed to create quest' },
      { status: 500 }
    )
  }
}

// PUT /api/quests?id={string}
export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Quest ID is required' }, { status: 400 })
  }

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, img, closed, config } = body

    const quest = await QuestService.updateQuest(id, {
      name,
      description,
      img,
      closed,
      config: config || undefined,
    })

    return NextResponse.json(quest)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}