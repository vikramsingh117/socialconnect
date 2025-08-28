import { NextRequest, NextResponse } from 'next/server'
import { optionalAuth } from '../../../../../lib/auth'
import { supabaseAdmin } from '../../../../../lib/supabase'
import { ApiResponse, Comment } from '../../../../../types'

async function getComments(request: NextRequest, user: any) {
  try {
    const pathParts = request.nextUrl.pathname.split('/')
    const postId = pathParts[pathParts.length - 2] // Get post ID from path
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Check if post exists
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Get comments with user info
    const { data: comments, error } = await supabaseAdmin
      .from('comments')
      .select(`
        *,
        user:users(id, username, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch comments' },
        { status: 500 }
      )
    }

    const response: ApiResponse<Comment[]> = {
      success: true,
      data: comments || [],
      message: 'Comments retrieved successfully'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = optionalAuth(getComments)
