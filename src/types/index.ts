export interface User {
  id: string
  email: string
  username: string
  bio?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  user_id: string
  content: string
  image_url?: string
  created_at: string
  updated_at: string
  user?: User
  likes_count?: number
  comments_count?: number
  is_liked?: boolean
}

export interface Comment {
  id: string
  user_id: string
  post_id: string
  content: string
  created_at: string
  user?: User
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
  follower?: User
  following?: User
}

export interface Like {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'follow' | 'like' | 'comment'
  content: string
  is_read: boolean
  created_at: string
  related_user_id?: string
  related_post_id?: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
