import { NextRequest, NextResponse } from 'next/server'
import { optionalAuth } from '../../../../lib/auth'
import { supabaseAdmin } from '../../../../lib/supabase'
import { ApiResponse, User } from '../../../../types'

async function getUserById(request: NextRequest, currentUser: User | null) {
  try {
    const userId = request.nextUrl.pathname.split('/').pop()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user profile
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, username, bio, avatar_url, created_at, updated_at')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Get follower/following counts
    const [followersCount, followingCount] = await Promise.all([
      supabaseAdmin
        .from('follows')
        .select('id', { count: 'exact' })
        .eq('following_id', userId),
      supabaseAdmin
        .from('follows')
        .select('id', { count: 'exact' })
        .eq('follower_id', userId)
    ])

    // Check if current user is following this user
    let isFollowing = false
    if (currentUser) {
      const { data: follow } = await supabaseAdmin
        .from('follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId)
        .single()
      
      isFollowing = !!follow
    }

    const userWithStats = {
      ...user,
      followers_count: followersCount.count || 0,
      following_count: followingCount.count || 0,
      is_following: isFollowing
    }

    const response: ApiResponse<User & { followers_count: number; following_count: number; is_following: boolean }> = {
      success: true,
      data: userWithStats,
      message: 'User profile retrieved successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = optionalAuth(getUserById)
