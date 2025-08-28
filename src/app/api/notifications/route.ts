import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../lib/auth'
import { supabaseAdmin } from '../../../lib/supabase'
import { ApiResponse, Notification } from '../../../types'

async function getNotifications(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const unreadOnly = searchParams.get('unread') === 'true'
    const offset = (page - 1) * limit

    // Build query
    let query = supabaseAdmin
      .from('notifications')
      .select(`
        *,
        related_user:users!notifications_related_user_id_fkey(id, username, avatar_url),
        related_post:posts!notifications_related_post_id_fkey(id, content)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter for unread only if requested
    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data: notifications, error } = await query

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    // Get unread count
    const { count: unreadCount } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    const response: ApiResponse<{
      notifications: Notification[];
      unread_count: number;
      total_count: number;
    }> = {
      success: true,
      data: {
        notifications: notifications || [],
        unread_count: unreadCount || 0,
        total_count: notifications?.length || 0
      },
      message: 'Notifications retrieved successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(getNotifications)
