import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '../../../../lib/supabase'
import { generateToken } from '../../../../lib/jwt'
import { generateUsername, validateEmail, validateUsername } from '../../../../lib/utils'
import { User, ApiResponse, AuthResponse } from '../../../../types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, username } = body

    // Validation
    if (!email || !password || !username) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and username are required' },
        { status: 400 }
      )
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    if (!validateUsername(username)) {
      return NextResponse.json(
        { success: false, error: 'Username must be 3-20 characters, alphanumeric and underscores only' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .or(`email.eq.${email},username.eq.${username}`)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email or username already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        username,
        password: hashedPassword
      })
      .select('id, email, username, bio, avatar_url, created_at, updated_at')
      .single()

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Generate JWT token
    const token = generateToken(user)

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        user,
        token
      },
      message: 'User registered successfully'
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
