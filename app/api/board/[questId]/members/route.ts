import { NextResponse } from 'next/server'
import { MemberService, UserProfileService } from '@/services/prisma'

interface RouteParams {
  params: {
    questId: string
  }
}

// POST /api/board/[questId]/members
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { address } = await request.json()
    const questId = parseInt(params.questId)

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    // Get or create user profile
    const user = await UserProfileService.getProfileByAddress(address)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already a member
    const isMember = await MemberService.isMember(questId, user.id)
    if (isMember) {
      return NextResponse.json(
        { error: 'User is already a member' },
        { status: 400 }
      )
    }

    const member = await MemberService.addMember({
      questId,
      userId: user.id,
    })

    return NextResponse.json(member)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/board/[questId]/members?address={address}
export async function GET(request: Request, { params }: RouteParams) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  const questId = parseInt(params.questId)

  try {
    if (address) {
      // Check if specific user is member
      const user = await UserProfileService.getProfileByAddress(address)
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const isMember = await MemberService.isMember(questId, user.id)
      return NextResponse.json({ isMember })
    } else {
      // Get all board members
      const board = await prisma.board.findUnique({
        where: { id: questId },
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      })

      if (!board) {
        return NextResponse.json({ error: 'Board not found' }, { status: 404 })
      }

      return NextResponse.json(board.members)
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}