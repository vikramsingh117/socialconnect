import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractTokenFromHeader } from './jwt'
import { supabaseAdmin } from './supabase'
import { User } from '../types'

export async function authenticateUser(request: NextRequest): Promise<User | null> {
  try {
    const authHeader = request.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader || '')
    
    if (!token) {
      return null
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return null
    }

    // Get user from database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single()

    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    return null
  }
}

export function requireAuth(handler: Function) {
  return async (request: NextRequest) => {
    const user = await authenticateUser(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return handler(request, user)
  }
}

export function optionalAuth(handler: Function) {
  return async (request: NextRequest) => {
    const user = await authenticateUser(request)
    return handler(request, user)
  }
}
