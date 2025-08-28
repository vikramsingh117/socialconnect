import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Notification } from '../types'

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  subscribeToRealtime: (userId: string) => void
  unsubscribeFromRealtime: () => void
}

export function useNotifications(userId?: string): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<any>(null)

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          related_user:users!notifications_related_user_id_fkey(id, username, avatar_url),
          related_post:posts!notifications_related_post_id_fkey(id, content)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setNotifications(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error

      setUnreadCount(count || 0)
    } catch (err: any) {
      console.error('Error fetching unread count:', err)
    }
  }, [userId])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!userId) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) throw error

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      )

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err: any) {
      setError(err.message)
    }
  }, [userId])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error

      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      )

      // Reset unread count
      setUnreadCount(0)
    } catch (err: any) {
      setError(err.message)
    }
  }, [userId])

  // Subscribe to real-time notifications
  const subscribeToRealtime = useCallback((userId: string) => {
    if (!userId) return

    // Unsubscribe from existing subscription
    if (subscription) {
      supabase.removeChannel(subscription)
    }

    const newSubscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newNotification = payload.new as Notification
          
          // Add new notification to the top of the list
          setNotifications(prev => [newNotification, ...prev])
          
          // Increment unread count if notification is unread
          if (!newNotification.is_read) {
            setUnreadCount(prev => prev + 1)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const updatedNotification = payload.new as Notification
          
          // Update notification in the list
          setNotifications(prev => 
            prev.map(notification => 
              notification.id === updatedNotification.id 
                ? updatedNotification 
                : notification
            )
          )
        }
      )
      .subscribe()

    setSubscription(newSubscription)
  }, [subscription])

  // Unsubscribe from real-time notifications
  const unsubscribeFromRealtime = useCallback(() => {
    if (subscription) {
      supabase.removeChannel(subscription)
      setSubscription(null)
    }
  }, [subscription])

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()
  }, [fetchNotifications, fetchUnreadCount])

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      unsubscribeFromRealtime()
    }
  }, [unsubscribeFromRealtime])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    subscribeToRealtime,
    unsubscribeFromRealtime
  }
}
