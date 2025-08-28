import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/auth'
import { supabaseAdmin } from '../../../../lib/supabase'
import { ApiResponse, Post } from '../../../../types'

async function createPost(request: NextRequest, user: any) {
  try {
    const body = await request.json()
    const { content, image_url } = body

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

    // Create post
    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .insert({
        user_id: user.id,
        content: content.trim(),
        image_url: image_url || null
      })
      .select('*')
      .single()

    if (error || !post) {
      return NextResponse.json(
        { success: false, error: 'Failed to create post' },
        { status: 500 }
      )
    }

    // Get user info for the post
    const { data: userInfo } = await supabaseAdmin
      .from('users')
      .select('id, username, avatar_url')
      .eq('id', user.id)
      .single()

    const postWithUser = {
      ...post,
      user: userInfo
    }

    const response: ApiResponse<Post> = {
      success: true,
      data: postWithUser,
      message: 'Post created successfully'
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = requireAuth(createPost)
