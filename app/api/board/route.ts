import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { QuestService } from "@/services/quest"
import { Session } from 'next-auth'
import { Prisma } from '@prisma/client'

interface CustomSession extends Session {
  user: {
    id: string;
    evmAddress: string | null;
    solanaAddress: string | null;
    nickname: string | null;
    avatar: string | null;
    socialAccount: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

// GET /api/board?id={string}
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions) as CustomSession | null
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const board = await prisma.board.findUnique({
        where: { id },
        include: {
          tasks: true,
        },
      })

      if (!board) {
        return NextResponse.json({ error: 'Board not found' }, { status: 404 })
      }

      return NextResponse.json(board)
    }

    const boards = await prisma.board.findMany({
      include: {
        tasks: true,
      },
    })

    return NextResponse.json(boards)
  } catch (error) {
    console.error('Error fetching boards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch boards' },
      { status: 500 }
    )
  }
}

// POST /api/board
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as CustomSession | null
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // First get the user profile by address
    const userProfile = await prisma.userProfile.findUnique({
      where: { address: session.user.evmAddress || '' }
    })

    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const board = await prisma.board.create({
      data: {
        chainId: data.chainId,
        name: data.name,
        description: data.description,
        img: data.img,
        rewardToken: data.rewardToken,
        config: data.config as Prisma.JsonValue,
      },
    })

    return NextResponse.json(board)
  } catch (error) {
    console.error('Error creating board:', error)
    return NextResponse.json(
      { error: 'Failed to create board' },
      { status: 500 }
    )
  }
}

// PUT /api/board
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions) as CustomSession | null
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    const board = await prisma.board.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
        img: data.img,
        rewardToken: data.rewardToken,
        config: data.config as Prisma.JsonValue,
      },
    })

    return NextResponse.json(board)
  } catch (error) {
    console.error('Error updating board:', error)
    return NextResponse.json(
      { error: 'Failed to update board' },
      { status: 500 }
    )
  }
}

export async function getQuests(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const quests = await QuestService.getQuests()
    return NextResponse.json(quests)
  } catch (error) {
    console.error('Error fetching quests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quests' },
      { status: 500 }
    )
  }
}

export async function createQuest(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const quest = await QuestService.createQuest(data)
    return NextResponse.json(quest)
  } catch (error) {
    console.error('Error creating quest:', error)
    return NextResponse.json(
      { error: 'Failed to create quest' },
      { status: 500 }
    )
  }
}