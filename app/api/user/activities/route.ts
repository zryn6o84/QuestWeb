import { NextResponse } from 'next/server'
import { ActivityLogService, UserProfileService } from '@/services/prisma'

// GET /api/user/activities?address={address}&limit={number}
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 })
  }

  try {
    const user = await UserProfileService.getProfileByAddress(address)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const activities = await ActivityLogService.getActivities(user.id, limit)
    return NextResponse.json(activities)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}