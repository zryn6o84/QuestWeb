import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface ProfileUpdateData {
  nickname?: string | null;
  avatar?: string | null;
  evmAddress?: string | null;
  solanaAddress?: string | null;
  auroAddress?: string | null;
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      console.error('Invalid session:', session);
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data: ProfileUpdateData = await req.json();

    console.log('Processing user update:', {
      userId: session.user.id,
      email: session.user.email,
      data
    });

    try {
      // Try to find user by ID
      const existingUser = await prisma.user.findUnique({
        where: { id: session.user.id }
      });

      if (!existingUser) {
        // If user doesn't exist, they need to log in again
        return NextResponse.json(
          { message: 'User not found. Please log in again.' },
          { status: 404 }
        );
      }

      // Update user profile
      const updateFields = {
        ...(data.nickname !== undefined && { nickname: data.nickname }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
        ...(data.evmAddress !== undefined && { evmAddress: data.evmAddress }),
        ...(data.solanaAddress !== undefined && { solanaAddress: data.solanaAddress }),
        ...(data.auroAddress !== undefined && { auroAddress: data.auroAddress }),
      };

      const user = await prisma.user.update({
        where: { id: session.user.id },
        data: updateFields,
      });

      return NextResponse.json({
        message: 'Profile updated successfully',
        user: user,
      });
    } catch (error) {
      console.error('Failed to update user:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return NextResponse.json(
            { message: 'Email already exists', error: 'This email is already registered' },
            { status: 409 }
          );
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      {
        message: 'Failed to update profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}