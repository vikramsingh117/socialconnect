'use client'

import { useState, useEffect } from 'react'
import { useNotifications } from '@/hooks/useNotifications'

export default function TestRealtime() {
  const [userId, setUserId] = useState('')
  const [testUserId, setTestUserId] = useState('')
  const [isClient, setIsClient] = useState(false)
  
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    subscribeToRealtime,
    unsubscribeFromRealtime 
  } = useNotifications(isClient ? userId : undefined)

  const [isSubscribed, setIsSubscribed] = useState(false)

  // Set client flag after hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  const subscribe = () => {
    if (userId) {
      subscribeToRealtime(userId)
      setIsSubscribed(true)
    }
  }

  const unsubscribe = () => {
    unsubscribeFromRealtime()
    setIsSubscribed(false)
  }

  const triggerNotification = async () => {
    if (!userId || !testUserId) return

    try {
      // Simulate a follow notification
      const response = await fetch('/api/users/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ user_id: testUserId })
      })

      if (response.ok) {
        console.log('Notification triggered!')
      }
    } catch (error) {
      console.error('Failed to trigger notification:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Real-time Notifications Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Controls</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">User ID to subscribe to:</label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter user ID"
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Test User ID (to trigger notifications):</label>
                <input
                  type="text"
                  value={testUserId}
                  onChange={(e) => setTestUserId(e.target.value)}
                  placeholder="Enter test user ID"
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={subscribe}
                  disabled={!userId || isSubscribed}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  Subscribe
                </button>
                <button
                  onClick={unsubscribe}
                  disabled={!isSubscribed}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
                >
                  Unsubscribe
                </button>
              </div>
              
              <button
                onClick={triggerNotification}
                disabled={!userId || !testUserId}
                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                Trigger Test Notification
              </button>
              
              <button
                onClick={markAllAsRead}
                disabled={notifications.length === 0}
                className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
              >
                Mark All as Read
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <div className="text-sm">
                <strong>Status:</strong> {isSubscribed ? '🟢 Subscribed' : '🔴 Not subscribed'}
              </div>
              <div className="text-sm">
                <strong>Unread Count:</strong> {unreadCount}
              </div>
              <div className="text-sm">
                <strong>Total Notifications:</strong> {notifications.length}
              </div>
            </div>
          </div>
          
          {/* Notifications */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Real-time Notifications</h2>
            
            {notifications.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No notifications yet. Subscribe and trigger some!
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                      !notification.is_read ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{notification.content}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(notification.created_at).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Type: {notification.type} | 
                          {notification.is_read ? ' ✅ Read' : ' 🔴 Unread'}
                        </div>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-red-500 rounded-full ml-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">How to Test:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Enter a user ID to subscribe to their notifications</li>
            <li>Click "Subscribe" to start listening for real-time updates</li>
            <li>Enter another user ID to trigger notifications from</li>
            <li>Click "Trigger Test Notification" to create a follow notification</li>
            <li>Watch the notification appear instantly in real-time!</li>
            <li>Click on notifications to mark them as read</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
