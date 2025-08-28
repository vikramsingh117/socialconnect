import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../../lib/auth'
import { supabaseAdmin } from '../../../../../lib/supabase'
import { ApiResponse } from '../../../../../types'

async function likePost(request: NextRequest, user: any) {
  try {
    const pathParts = request.nextUrl.pathname.split('/')
    const postId = pathParts[pathParts.length - 2] // Get post ID from path

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Check if post exists
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select('id, user_id')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if already liked
    const { data: existingLike } = await supabaseAdmin
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .single()

    if (existingLike) {
      return NextResponse.json(
        { success: false, error: 'Post already liked' },
        { status: 409 }
      )
    }

    // Create like
    const { error: likeError } = await supabaseAdmin
      .from('likes')
      .insert({
        user_id: user.id,
        post_id: postId
      })

    if (likeError) {
      return NextResponse.json(
        { success: false, error: 'Failed to like post' },
        { status: 500 }
      )
    }

    // Create notification (don't notify for self-likes)
    if (post.user_id !== user.id) {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: post.user_id,
          type: 'like',
          content: `${user.username} liked your post`,
          related_user_id: user.id,
          related_post_id: postId
        })
    }

    const response: ApiResponse = {
      success: true,
      message: 'Post liked successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Like post error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function unlikePost(request: NextRequest, user: any) {
  try {
    const pathParts = request.nextUrl.pathname.split('/')
    const postId = pathParts[pathParts.length - 2] // Get post ID from path

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Delete like
    const { error } = await supabaseAdmin
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId)

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to unlike post' },
        { status: 500 }
      )
    }

    const response: ApiResponse = {
      success: true,
      message: 'Post unliked successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Unlike post error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = requireAuth(likePost)
export const DELETE = requireAuth(unlikePost)
