import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/auth'
import { supabaseAdmin } from '../../../../lib/supabase'
import { ApiResponse, User } from '../../../../types'

async function getProfile(request: NextRequest, user: User) {
  try {
    // Get follower/following counts
    const [followersCount, followingCount] = await Promise.all([
      supabaseAdmin
        .from('follows')
        .select('id', { count: 'exact' })
        .eq('following_id', user.id),
      supabaseAdmin
        .from('follows')
        .select('id', { count: 'exact' })
        .eq('follower_id', user.id)
    ])

    const userWithStats = {
      ...user,
      followers_count: followersCount.count || 0,
      following_count: followingCount.count || 0
    }

    const response: ApiResponse<User & { followers_count: number; following_count: number }> = {
      success: true,
      data: userWithStats,
      message: 'Profile retrieved successfully'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function updateProfile(request: NextRequest, user: User) {
  try {
    const body = await request.json()
    const { username, bio, avatar_url } = body

    // Validation
    if (username && username.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Username must be at least 3 characters' },
        { status: 400 }
      )
    }

    if (bio && bio.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Bio must be less than 500 characters' },
        { status: 400 }
      )
    }

    // Check if username is already taken (if changing username)
    if (username && username !== user.username) {
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('username', username)
        .single()

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Username already taken' },
          { status: 409 }
        )
      }
    }

    // Update user profile
    const updateData: Partial<User> = {}
    if (username) updateData.username = username
    if (bio !== undefined) updateData.bio = bio
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select('*')
      .single()

    if (error || !updatedUser) {
      return NextResponse.json(
        { success: false, error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    const response: ApiResponse<User> = {
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(getProfile)
export const PUT = requireAuth(updateProfile)
