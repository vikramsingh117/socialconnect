import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ApiResponse } from '@/types'

async function followUser(request: NextRequest, user: any) {
  try {
    const body = await request.json()
    const { user_id } = body

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Prevent self-following
    if (user_id === user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot follow yourself' },
        { status: 400 }
      )
    }

    // Check if user exists
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already following
    const { data: existingFollow } = await supabaseAdmin
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', user_id)
      .single()

    if (existingFollow) {
      return NextResponse.json(
        { success: false, error: 'Already following this user' },
        { status: 409 }
      )
    }

    // Create follow relationship
    const { error: followError } = await supabaseAdmin
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: user_id
      })

    if (followError) {
      return NextResponse.json(
        { success: false, error: 'Failed to follow user' },
        { status: 500 }
      )
    }

    // Create notification
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id,
        type: 'follow',
        content: `${user.username} started following you`,
        related_user_id: user.id
      })

    const response: ApiResponse = {
      success: true,
      message: 'User followed successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Follow error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function unfollowUser(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Delete follow relationship
    const { error } = await supabaseAdmin
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', user_id)

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to unfollow user' },
        { status: 500 }
      )
    }

    const response: ApiResponse = {
      success: true,
      message: 'User unfollowed successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Unfollow error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = requireAuth(followUser)
export const DELETE = requireAuth(unfollowUser)
