'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useNotifications } from '@/hooks/useNotifications'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('password123')
  const [username, setUsername] = useState('testuser')
  const [postContent, setPostContent] = useState('')
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isClient, setIsClient] = useState(false)

  // Use the notifications hook only on client side
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    subscribeToRealtime,
    unsubscribeFromRealtime 
  } = useNotifications(isClient ? user?.id : undefined)

  // Set client flag after hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Subscribe to real-time notifications when user logs in
  useEffect(() => {
    if (isClient && user?.id) {
      subscribeToRealtime(user.id)
      fetchPosts()
    }
    return () => {
      if (isClient && user?.id) {
        unsubscribeFromRealtime()
      }
    }
  }, [isClient, user?.id])

  const apiCall = async (endpoint: string, options: any = {}) => {
    const url = `/api${endpoint}`
    // Get token from user object or localStorage
    const token = user?.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
    // console.log('🔑 API Call - final token:', token)
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'API call failed')
      }
      
      return data
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
      throw error
    }
  }

  const register = async () => {
    setLoading(true)
    try {
      const data = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, username })
      })
      setUser(data.data)
      setMessage('Registered successfully!')
    } catch (error: any) {
      // Check if it's a "user already exists" error
      if (error.message.includes('already exists') || error.message.includes('409')) {
        setMessage('User already exists. Please login instead.')
      } else {
        setMessage(`Registration failed: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async () => {
    setLoading(true)
    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
      // console.log('🔑 Login response:', data)
      setUser(data.data)
      // Store token in localStorage for persistence
      if (data.data.token) {
        localStorage.setItem('token', data.data.token)
      }
      setMessage('Logged in successfully!')
      // Fetch posts and user profile after successful login
      await Promise.all([fetchPosts(), fetchUserProfile()])
    } catch (error: any) {
      console.error('Login failed:', error)
      setMessage(`Login failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await apiCall('/auth/logout', { method: 'POST' })
      setUser(null)
      setPosts([])
      // Clear token from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
      }
      setMessage('Logged out successfully!')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const createPost = async () => {
    if (!postContent.trim()) return
    
    setLoading(true)
    try {
      const data = await apiCall('/posts/create', {
        method: 'POST',
        body: JSON.stringify({ content: postContent })
      })
      setPostContent('')
      await fetchPosts()
      setMessage('Post created successfully!')
    } catch (error) {
      console.error('Create post failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPosts = async () => {
    try {
      const data = await apiCall('/posts/feed')
      console.log('📰 Fetched posts:', data.data)
      setPosts(data.data || [])
    } catch (error) {
      console.error('Fetch posts failed:', error)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const data = await apiCall('/users/profile')
      console.log('👤 Fetched user profile:', data.data)
      // Update user with profile data including follower counts
      setUser((prev: any) => {
        const updatedUser = {
          ...prev,
          user: { ...prev.user, ...data.data }
        }
        console.log('🔄 Updated user state:', updatedUser)
        return updatedUser
      })
    } catch (error) {
      console.error('Fetch user profile failed:', error)
    }
  }

  const likePost = async (postId: string) => {
    console.log('👍 Liking post:', postId)
    try {
      await apiCall(`/posts/${postId}/like`, { method: 'POST' })
      await fetchPosts()
    } catch (error) {
      console.error('Like post failed:', error)
    }
  }

  const unlikePost = async (postId: string) => {
    console.log('👎 Unliking post:', postId)
    try {
      await apiCall(`/posts/${postId}/like`, { method: 'DELETE' })
      await fetchPosts()
    } catch (error) {
      console.error('Unlike post failed:', error)
    }
  }

  const commentOnPost = async (postId: string) => {
    try {
      const content = typeof window !== 'undefined' ? window.prompt('Write a comment (max 500 chars):') : ''
      if (content == null) return
      const trimmed = content.trim()
      if (!trimmed) return
      if (trimmed.length > 500) {
        setMessage('Comment must be less than 500 characters')
        return
      }
      await apiCall(`/posts/${postId}/comment`, {
        method: 'POST',
        body: JSON.stringify({ content: trimmed })
      })
      await fetchPosts()
      setMessage('Comment added successfully!')
    } catch (error) {
      console.error('Comment post failed:', error)
    }
  }

  const followUser = async (userId: string) => {
    console.log('👥 Following user:', userId)
    try {
      await apiCall('/users/follow', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId })
      })
      setMessage('User followed successfully!')
      // Refresh user profile to update following count
      await fetchUserProfile()
    } catch (error) {
      console.error('Follow user failed:', error)
    }
  }

  // Login/Register Form
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
        <div className="max-w-md mx-auto">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
              <span className="text-2xl text-white font-bold">SC</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SocialConnect
            </h1>
            <p className="text-gray-600 mt-2">Connect, Share, Discover</p>
          </div>
          
          {/* Auth Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={register}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {loading ? 'Creating Account...' : 'Register'}
                </button>
                <button
                  onClick={login}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl font-medium hover:from-green-600 hover:to-green-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {loading ? 'Signing In...' : 'Login'}
                </button>
              </div>
              
              <div className="text-center">
                <button
                  onClick={() => {
                    setEmail('test@example.com')
                    setPassword('password123')
                    setUsername('testuser')
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                >
                  🚀 Fill with test data
                </button>
              </div>
            </div>
            
            {message && (
              <div className={`mt-6 p-4 rounded-xl border-l-4 ${
                message.includes('successfully') 
                  ? 'bg-green-50 border-green-400 text-green-800' 
                  : message.includes('failed') || message.includes('already exists')
                  ? 'bg-red-50 border-red-400 text-red-800'
                  : 'bg-yellow-50 border-yellow-400 text-yellow-800'
              }`}>
                <div className="flex items-center">
                  <span className="mr-2">
                    {message.includes('successfully') ? '✅' : message.includes('failed') || message.includes('already exists') ? '❌' : '⚠️'}
                  </span>
                  {message}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Main App Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SC</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SocialConnect
            </h1>
          </div>
          
                      <div className="flex items-center space-x-6">
              {/* Notification Bell */}
              <div className="relative">
                <button 
                  onClick={() => markAllAsRead()}
                  className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 relative"
                >
                  <span className="text-xl">🔔</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {notifications.length > 0 && (
                  <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-10 max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${
                          !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-400' : ''
                        }`}
                      >
                        <div className="text-sm font-medium">{notification.content}</div>
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">Welcome, {user.user.username}!</div>
                  <div className="flex space-x-2 mt-1">
                    <span className="bg-gradient-to-r from-blue-100 to-blue-200 px-3 py-1 rounded-full text-xs font-medium text-blue-800">
                      {user.user.followers_count || 0} followers
                    </span>
                    <span className="bg-gradient-to-r from-green-100 to-green-200 px-3 py-1 rounded-full text-xs font-medium text-green-800">
                      {user.user.following_count || 0} following
                    </span>
                  </div>
                  {/* Debug info */}
                  <div className="text-xs text-gray-500 mt-1">
                    Debug: {JSON.stringify({ 
                      followers: user.user.followers_count, 
                      following: user.user.following_count 
                    })}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Logout
                </button>
              </div>
            </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Create Post */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <h2 className="text-xl font-bold mb-6 text-gray-800">Create Post</h2>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="What's on your mind?"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            <button
              onClick={createPost}
              disabled={loading || !postContent.trim()}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>



        {/* Posts Feed */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-800">Feed</h2>
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {post.user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{post.user?.username}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(post.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <p className="mb-6 text-gray-700 text-lg leading-relaxed">{post.content}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => {
                      console.log('Like button clicked, post.is_liked:', post.is_liked, 'post.id:', post.id)
                      if (post.is_liked) {
                        unlikePost(post.id)
                      } else {
                        likePost(post.id)
                      }
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                      post.is_liked 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-xl">{post.is_liked ? '❤️' : '🤍'}</span>
                    <span className="font-medium">{post.likes_count || 0}</span>
                  </button>
                  
                  <button
                    onClick={() => commentOnPost(post.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200"
                  >
                    <span className="text-xl">💬</span>
                    <span className="font-medium text-gray-600">{post.comments_count || 0}</span>
                  </button>
                </div>
                
                {post.user_id !== user.user.id && (
                  <button
                    onClick={() => {
                      console.log('Follow button clicked for user:', post.user_id, 'current user:', user.user.id)
                      followUser(post.user_id)
                    }}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Follow
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {message && (
          <div className={`fixed bottom-6 right-6 p-4 rounded-2xl shadow-2xl border-l-4 z-50 max-w-sm ${
            message.includes('successfully') 
              ? 'bg-green-50 border-green-400 text-green-800' 
              : message.includes('failed') || message.includes('already exists')
              ? 'bg-red-50 border-red-400 text-red-800'
              : 'bg-yellow-50 border-yellow-400 text-yellow-800'
          }`}>
            <div className="flex items-center">
              <span className="mr-3 text-xl">
                {message.includes('successfully') ? '✅' : message.includes('failed') || message.includes('already exists') ? '❌' : '⚠️'}
              </span>
              <div>
                <div className="font-medium">
                  {message.includes('successfully') ? 'Success!' : message.includes('failed') || message.includes('already exists') ? 'Error!' : 'Notice!'}
                </div>
                <div className="text-sm opacity-90">{message}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

