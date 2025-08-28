import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ApiResponse } from '@/types'

async function markNotificationRead(request: NextRequest, user: any) {
  try {
    const notificationId = request.nextUrl.pathname.split('/').pop()

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'Notification ID is required' },
        { status: 400 }
      )
    }

    // Check if notification exists and belongs to user
    const { data: notification, error: checkError } = await supabaseAdmin
      .from('notifications')
      .select('id, user_id')
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .single()

    if (checkError || !notification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      )
    }

    // Mark as read
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to mark notification as read' },
        { status: 500 }
      )
    }

    const response: ApiResponse = {
      success: true,
      message: 'Notification marked as read'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Mark notification read error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function markAllNotificationsRead(request: NextRequest, user: any) {
  try {
    // Mark all user's notifications as read
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to mark notifications as read' },
        { status: 500 }
      )
    }

    const response: ApiResponse = {
      success: true,
      message: 'All notifications marked as read'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Mark all notifications read error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const PUT = requireAuth(markNotificationRead)
export const PATCH = requireAuth(markAllNotificationsRead)
