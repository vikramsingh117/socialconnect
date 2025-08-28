import jwt from 'jsonwebtoken'
import { User } from '../types'
const JWT_SECRET = process.env.JWT_SECRET!

export function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      username: user.username 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): { id: string; email: string; username: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; username: string }
  } catch {
    return null
  }
}

export function extractTokenFromHeader(authHeader: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}
