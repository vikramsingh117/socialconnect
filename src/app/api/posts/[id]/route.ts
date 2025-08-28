import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, optionalAuth } from '../../../../lib/auth'
import { supabaseAdmin } from '../../../../lib/supabase'
import { ApiResponse, Post } from '../../../../types'

async function getPost(request: NextRequest, user: any) {
  try {
    const postId = request.nextUrl.pathname.split('/').pop()

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Get post with user info
    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .select(`
        *,
        user:users(id, username, avatar_url)
      `)
      .eq('id', postId)
      .single()

    if (error || !post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Get like and comment counts
    const [likesCount, commentsCount] = await Promise.all([
      supabaseAdmin
        .from('likes')
        .select('id', { count: 'exact' })
        .eq('post_id', postId),
      supabaseAdmin
        .from('comments')
        .select('id', { count: 'exact' })
        .eq('post_id', postId)
    ])

    // Check if current user liked the post
    let isLiked = false
    if (user) {
      const { data: like } = await supabaseAdmin
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single()
      
      isLiked = !!like
    }

    const postWithStats = {
      ...post,
      likes_count: likesCount.count || 0,
      comments_count: commentsCount.count || 0,
      is_liked: isLiked
    }

    const response: ApiResponse<Post> = {
      success: true,
      data: postWithStats,
      message: 'Post retrieved successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Get post error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function updatePost(request: NextRequest, user: any) {
  try {
    const postId = request.nextUrl.pathname.split('/').pop()
    const body = await request.json()
    const { content, image_url } = body

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Validation
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Post content is required' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Post content must be less than 1000 characters' },
        { status: 400 }
      )
    }

    // Check if post exists and user owns it
    const { data: existingPost, error: checkError } = await supabaseAdmin
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single()

    if (checkError || !existingPost) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    if (existingPost.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to update this post' },
        { status: 403 }
      )
    }

    // Update post
    const { data: updatedPost, error } = await supabaseAdmin
      .from('posts')
      .update({
        content: content.trim(),
        image_url: image_url || null
      })
      .eq('id', postId)
      .select(`
        *,
        user:users(id, username, avatar_url)
      `)
      .single()

    if (error || !updatedPost) {
      return NextResponse.json(
        { success: false, error: 'Failed to update post' },
        { status: 500 }
      )
    }

    const response: ApiResponse<Post> = {
      success: true,
      data: updatedPost,
      message: 'Post updated successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Update post error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function deletePost(request: NextRequest, user: any) {
  try {
    const postId = request.nextUrl.pathname.split('/').pop()

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Check if post exists and user owns it
    const { data: existingPost, error: checkError } = await supabaseAdmin
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single()

    if (checkError || !existingPost) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    if (existingPost.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to delete this post' },
        { status: 403 }
      )
    }

    // Delete post (cascade will handle likes and comments)
    const { error } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', postId)

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete post' },
        { status: 500 }
      )
    }

    const response: ApiResponse = {
      success: true,
      message: 'Post deleted successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = optionalAuth(getPost)
export const PUT = requireAuth(updatePost)
export const DELETE = requireAuth(deletePost)
