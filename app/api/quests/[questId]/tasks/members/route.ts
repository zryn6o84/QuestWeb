import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { MemberService, UserProfileService, prisma } from '@/services/prisma'

interface RouteParams {
  params: {
    questId: string
  }
}

// POST /api/quests/[questId]/members
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { address } = await request.json()

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    // Get or create user profile
    const user = await UserProfileService.getProfileByAddress(address)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already a member
    const isMember = await MemberService.isMember(params.questId, user.id)
    if (isMember) {
      return NextResponse.json(
        { error: 'User is already a member' },
        { status: 400 }
      )
    }

    const member = await MemberService.addMember({
      questId: params.questId,
      userId: user.id,
    })

    return NextResponse.json(member)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/quests/[questId]/members?address={address}
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (address) {
      // Check if specific user is member
      const user = await UserProfileService.getProfileByAddress(address)
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const isMember = await MemberService.isMember(params.questId, user.id)
      return NextResponse.json({ isMember })
    } else {
      // Get all quest members
      const quest = await prisma.quest.findUnique({
        where: { id: params.questId },
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      })

      if (!quest) {
        return NextResponse.json({ error: 'Quest not found' }, { status: 404 })
      }

      return NextResponse.json(quest.members)
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}