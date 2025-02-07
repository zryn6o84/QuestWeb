import { NextResponse } from 'next/server'
import { NotificationService, UserProfileService } from '@/services/prisma'

// GET /api/user/notifications?address={address}&includeRead={boolean}
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  const includeRead = searchParams.get('includeRead') === 'true'

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 })
  }

  try {
    const user = await UserProfileService.getProfileByAddress(address)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const notifications = await NotificationService.getUserNotifications(user.id, includeRead)
    return NextResponse.json(notifications)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/user/notifications/read
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { address, notificationId } = body

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    const user = await UserProfileService.getProfileByAddress(address)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (notificationId) {
      // Mark single notification as read
      await NotificationService.markAsRead(notificationId)
    } else {
      // Mark all notifications as read
      await NotificationService.markAllAsRead(user.id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}