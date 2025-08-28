import { supabase } from './supabase'
import { Notification } from '../types'

// Module-level subscriptions map
const subscriptions: Map<string, any> = new Map()

// Subscribe to real-time notifications for a user
export function subscribeToNotifications(
  userId: string,
  callback: (notification: Notification) => void
) {
  // Unsubscribe if already subscribed
  unsubscribeFromNotifications(userId)

  const subscription = supabase
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
        const notification = payload.new as Notification
        callback(notification)
      }
    )
    .subscribe()

  subscriptions.set(userId, subscription)
  return subscription
}

// Unsubscribe from notifications
export function unsubscribeFromNotifications(userId: string) {
  const subscription = subscriptions.get(userId)
  if (subscription) {
    supabase.removeChannel(subscription)
    subscriptions.delete(userId)
  }
}

// Unsubscribe from all notifications
export function unsubscribeFromAll() {
  subscriptions.forEach((subscription) => {
    supabase.removeChannel(subscription)
  })
  subscriptions.clear()
}

// Get notification count
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('Error getting unread count:', error)
    return 0
  }

  return count || 0
}

// Mark notification as read
export async function markAsRead(notificationId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error marking notification as read:', error)
    return false
  }

  return true
}

// Mark all notifications as read
export async function markAllAsRead(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('Error marking all notifications as read:', error)
    return false
  }

  return true
}
