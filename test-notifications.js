const BASE_URL = 'http://localhost:3000/api';

// Test data
let authToken = '';
let authToken2 = '';
let userId = '';
let userId2 = '';
let postId = '';
let notificationId = '';

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    console.log(`\n${options.method || 'GET'} ${endpoint}`);
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return { response, data };
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error.message);
    return { response: null, data: null };
  }
}

// Test functions
async function testLogin() {
  console.log('\n🧪 Logging in users...');
  
  // Login user 1
  const { data: data1 } = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123'
    })
  });
  
  if (data1?.success) {
    authToken = data1.data.token;
    userId = data1.data.user.id;
    console.log('✅ User 1 logged in');
  }
  
  // Login user 2
  const { data: data2 } = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'test2@example.com',
      password: 'password123'
    })
  });
  
  if (data2?.success) {
    authToken2 = data2.data.token;
    userId2 = data2.data.user.id;
    console.log('✅ User 2 logged in');
  }
}

async function testCreatePost() {
  console.log('\n🧪 Creating a post to trigger notifications...');
  
  const { data } = await apiCall('/posts/create', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${authToken}` },
    body: JSON.stringify({
      content: 'This post will generate notifications!'
    })
  });
  
  if (data?.success) {
    postId = data.data.id;
    console.log('✅ Post created successfully');
  }
}

async function testFollowNotification() {
  console.log('\n🧪 Testing follow notification...');
  
  // User 1 follows User 2 (should create notification)
  await apiCall('/users/follow', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${authToken}` },
    body: JSON.stringify({ user_id: userId2 })
  });
}

async function testLikeNotification() {
  console.log('\n🧪 Testing like notification...');
  
  // User 2 likes User 1's post (should create notification)
  await apiCall(`/posts/${postId}/like`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${authToken2}` }
  });
}

async function testCommentNotification() {
  console.log('\n🧪 Testing comment notification...');
  
  // User 2 comments on User 1's post (should create notification)
  await apiCall(`/posts/${postId}/comment`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${authToken2}` },
    body: JSON.stringify({
      content: 'Great post! This should create a notification.'
    })
  });
}

async function testGetNotifications() {
  console.log('\n🧪 Testing get notifications...');
  
  // Get User 1's notifications
  const { data } = await apiCall('/notifications', {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  
  if (data?.success && data.data.notifications.length > 0) {
    notificationId = data.data.notifications[0].id;
    console.log(`✅ Found ${data.data.notifications.length} notifications`);
    console.log(`Unread count: ${data.data.unread_count}`);
  }
}

async function testMarkNotificationRead() {
  console.log('\n🧪 Testing mark notification as read...');
  
  if (notificationId) {
    await apiCall(`/notifications/${notificationId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
  }
}

async function testMarkAllNotificationsRead() {
  console.log('\n🧪 Testing mark all notifications as read...');
  
  await apiCall('/notifications', {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
}

async function testRealtimeEndpoint() {
  console.log('\n🧪 Testing real-time notifications endpoint...');
  
  await apiCall('/notifications/realtime', {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
}

async function testUnreadOnlyFilter() {
  console.log('\n🧪 Testing unread notifications filter...');
  
  await apiCall('/notifications?unread=true', {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
}

// Run all tests
async function runNotificationTests() {
  console.log('🚀 Starting Notification System Tests...\n');
  
  try {
    await testLogin();
    await testCreatePost();
    await testFollowNotification();
    await testLikeNotification();
    await testCommentNotification();
    await testGetNotifications();
    await testMarkNotificationRead();
    await testMarkAllNotificationsRead();
    await testRealtimeEndpoint();
    await testUnreadOnlyFilter();
    
    console.log('\n🎉 All notification tests completed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runNotificationTests();
}

module.exports = { runNotificationTests };
