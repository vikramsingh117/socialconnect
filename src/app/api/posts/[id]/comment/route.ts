import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../../lib/auth'
import { supabaseAdmin } from '../../../../../lib/supabase'
import { ApiResponse, Comment } from '../../../../../types'

async function createComment(request: NextRequest, user: any) {
  try {
    const pathParts = request.nextUrl.pathname.split('/')
    const postId = pathParts[pathParts.length - 2] // Get post ID from path
    const body = await request.json()
    const { content } = body

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Comment content is required' },
        { status: 400 }
      )
    }

    if (content.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Comment must be less than 500 characters' },
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

    // Create comment
    const { data: comment, error: commentError } = await supabaseAdmin
      .from('comments')
      .insert({
        user_id: user.id,
        post_id: postId,
        content: content.trim()
      })
      .select(`
        *,
        user:users(id, username, avatar_url)
      `)
      .single()

    if (commentError || !comment) {
      return NextResponse.json(
        { success: false, error: 'Failed to create comment' },
        { status: 500 }
      )
    }

    // Create notification (don't notify for self-comments)
    if (post.user_id !== user.id) {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: post.user_id,
          type: 'comment',
          content: `${user.username} commented on your post`,
          related_user_id: user.id,
          related_post_id: postId
        })
    }

    const response: ApiResponse<Comment> = {
      success: true,
      data: comment,
      message: 'Comment created successfully'
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Create comment error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = requireAuth(createComment)
