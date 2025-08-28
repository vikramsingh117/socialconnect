import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/auth'
import { supabaseAdmin } from '../../../../lib/supabase'
import { ApiResponse, Post } from '../../../../types'

async function getFeed(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Get users that the current user is following
    const { data: following } = await supabaseAdmin
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)

    const followingIds = following?.map(f => f.following_id) || []
    
    // Include current user's posts in feed
    followingIds.push(user.id)

    // Get posts from followed users (including self)
    const { data: posts, error } = await supabaseAdmin
      .from('posts')
      .select(`
        *,
        user:users(id, username, avatar_url)
      `)
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch feed' },
        { status: 500 }
      )
    }

    // Get like and comment counts for each post
    const postsWithStats = await Promise.all(
      posts?.map(async (post) => {
        const [likesCountRes, commentsCountRes, likeRowRes] = await Promise.all([
          supabaseAdmin
            .from('likes')
            .select('id', { count: 'exact' })
            .eq('post_id', post.id),
          supabaseAdmin
            .from('comments')
            .select('id', { count: 'exact' })
            .eq('post_id', post.id),
          supabaseAdmin
            .from('likes')
            .select('id')
            .eq('user_id', user.id)
            .eq('post_id', post.id)
            .maybeSingle()
        ])

        const likesCount = likesCountRes.count || 0
        const commentsCount = commentsCountRes.count || 0
        const isLiked = !!likeRowRes.data

        return {
          ...post,
          likes_count: likesCount,
          comments_count: commentsCount,
          is_liked: isLiked
        }
      }) || []
    )

    const response: ApiResponse<Post[]> = {
      success: true,
      data: postsWithStats,
      message: 'Feed retrieved successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Get feed error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(getFeed)
