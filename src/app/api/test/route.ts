import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  const response: ApiResponse = {
    success: true,
    message: 'SocialConnect API is running!',
    data: {
      version: '1.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString()
    }
  }

  return NextResponse.json(response)
}
