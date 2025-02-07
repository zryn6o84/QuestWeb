import { NextResponse } from 'next/server'
import { UserProfileService } from '@/services/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { hash, compare } from 'bcryptjs'
import { verifyMessage } from 'viem'
import { Prisma } from '@prisma/client'

// GET /api/user/profile?id={id}
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        email: true,
        evmAddress: true,
        solanaAddress: true,
        auroAddress: true,
        githubId: true,
        githubUsername: true,
        githubName: true,
        discordId: true,
        discordUsername: true,
        discordName: true,
        twitterId: true,
        twitterUsername: true,
        twitterName: true,
        telegramId: true,
        telegramUsername: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Transform the response to match the UserProfile interface
    const transformedUser = {
      ...user,
      socialAccounts: {
        github: user.githubId ? {
          id: user.githubId,
          username: user.githubUsername,
          name: user.githubName,
        } : null,
        discord: user.discordId ? {
          id: user.discordId,
          username: user.discordUsername,
          name: user.discordName,
        } : null,
        twitter: user.twitterId ? {
          id: user.twitterId,
          username: user.twitterUsername,
          name: user.twitterName,
        } : null,
        telegram: user.telegramId ? {
          id: user.telegramId,
          username: user.telegramUsername,
        } : null,
      }
    }

    // Remove the individual social fields from the response
    const {
      githubId, githubUsername, githubName,
      discordId, discordUsername, discordName,
      twitterId, twitterUsername, twitterName,
      telegramId, telegramUsername,
      ...cleanUser
    } = transformedUser

    return NextResponse.json(cleanUser)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

// POST /api/user/profile
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { evmAddress, solanaAddress, nickname, avatar, socialAccount } = body

    if (!evmAddress && !solanaAddress) {
      return NextResponse.json(
        { error: 'Either evmAddress or solanaAddress is required' },
        { status: 400 }
      )
    }

    const profile = await UserProfileService.upsertProfile({
      evmAddress,
      solanaAddress,
      nickname,
      avatar,
      socialAccount,
    })

    return NextResponse.json(profile)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { nickname, avatar, email, currentPassword, newPassword, wallets } = data

    // Prepare update data
    const updateData: any = {}
    if (nickname) updateData.nickname = nickname
    if (avatar) updateData.avatar = avatar

    // Handle email and password update
    if (email || newPassword) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          password: true,
        }
      })

      if (!user || !currentPassword) {
        return NextResponse.json({ error: 'Current password is required' }, { status: 400 })
      }

      const isValid = await compare(currentPassword, user.password)
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid current password' }, { status: 400 })
      }

      if (email) updateData.email = email
      if (newPassword) {
        updateData.password = await hash(newPassword, 12)
      }
    }

    // Handle wallet connections
    if (wallets) {
      if (wallets.evm !== undefined) updateData.evmAddress = wallets.evm
      if (wallets.solana !== undefined) updateData.solanaAddress = wallets.solana
      if (wallets.auro !== undefined) updateData.auroAddress = wallets.auro
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        nickname: true,
        avatar: true,
        email: true,
        evmAddress: true,
        solanaAddress: true,
        auroAddress: true,
        socialAccount: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

export async function GET_session(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        nickname: true,
        avatar: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error('Invalid session:', session)
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await req.json()

    console.log('Processing user update:', {
      userId: session.user.id,
      email: session.user.email,
      data
    })

    try {
      // Try to find user by ID
      const existingUser = await prisma.user.findUnique({
        where: { id: session.user.id }
      })

      if (!existingUser) {
        return NextResponse.json(
          { message: 'User not found. Please log in again.' },
          { status: 404 }
        )
      }

      // Update user profile
      const updateFields = {
        ...(data.nickname !== undefined && { nickname: data.nickname }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
        ...(data.evmAddress !== undefined && { evmAddress: data.evmAddress }),
        ...(data.solanaAddress !== undefined && { solanaAddress: data.solanaAddress }),
        ...(data.auroAddress !== undefined && { auroAddress: data.auroAddress }),
      }

      const user = await prisma.user.update({
        where: { id: session.user.id },
        data: updateFields,
        select: {
          id: true,
          email: true,
          nickname: true,
          avatar: true,
          evmAddress: true,
          solanaAddress: true,
          auroAddress: true,
          githubId: true,
          githubUsername: true,
          githubName: true,
          discordId: true,
          discordUsername: true,
          discordName: true,
          twitterId: true,
          twitterUsername: true,
          twitterName: true,
          telegramId: true,
          telegramUsername: true,
          createdAt: true,
        }
      })

      // Transform the response to match the UserProfile interface
      const transformedUser = {
        ...user,
        socialAccounts: {
          github: user.githubId ? {
            id: user.githubId,
            username: user.githubUsername,
            name: user.githubName,
          } : null,
          discord: user.discordId ? {
            id: user.discordId,
            username: user.discordUsername,
            name: user.discordName,
          } : null,
          twitter: user.twitterId ? {
            id: user.twitterId,
            username: user.twitterUsername,
            name: user.twitterName,
          } : null,
          telegram: user.telegramId ? {
            id: user.telegramId,
            username: user.telegramUsername,
          } : null,
        }
      }

      // Remove the individual social fields from the response
      const {
        githubId, githubUsername, githubName,
        discordId, discordUsername, discordName,
        twitterId, twitterUsername, twitterName,
        telegramId, telegramUsername,
        ...cleanUser
      } = transformedUser

      return NextResponse.json({
        message: 'Profile updated successfully',
        user: cleanUser,
      })
    } catch (error) {
      console.error('Failed to update user:', error)
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return NextResponse.json(
            { message: 'Email already exists', error: 'This email is already registered' },
            { status: 409 }
          )
        }
      }
      throw error
    }
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      {
        message: 'Failed to update profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}