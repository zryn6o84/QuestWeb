import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, address, chainId } = await req.json();

    // Validate input
    if (!type || !address) {
      return NextResponse.json(
        { error: 'Type and address are required' },
        { status: 400 }
      );
    }

    // Check if wallet is already bound to any user
    const existingWallet = await prisma.wallet.findFirst({
      where: {
        type,
        address,
      },
    });

    if (existingWallet) {
      return NextResponse.json(
        { error: 'Wallet already bound to a user' },
        { status: 400 }
      );
    }

    // Create new wallet binding
    const wallet = await prisma.wallet.create({
      data: {
        type,
        address,
        chainId,
        userId: session.user.id,
      },
    });

    return NextResponse.json(wallet);
  } catch (error) {
    console.error('Error binding wallet:', error);
    return NextResponse.json(
      { error: 'Failed to bind wallet' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, address } = await req.json();

    // Validate input
    if (!type || !address) {
      return NextResponse.json(
        { error: 'Type and address are required' },
        { status: 400 }
      );
    }

    // Check if wallet belongs to user
    const wallet = await prisma.wallet.findFirst({
      where: {
        type,
        address,
        userId: session.user.id,
      },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found or does not belong to user' },
        { status: 404 }
      );
    }

    // Delete wallet binding
    await prisma.wallet.delete({
      where: {
        id: wallet.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unbinding wallet:', error);
    return NextResponse.json(
      { error: 'Failed to unbind wallet' },
      { status: 500 }
    );
  }
}