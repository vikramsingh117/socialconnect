import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '../../../../types'

export async function POST(request: NextRequest) {
  try {
    // For JWT-based auth, logout is handled client-side by removing the token
    // This endpoint can be used for additional cleanup if needed
    
    const response: ApiResponse = {
      success: true,
      message: 'Logout successful'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
