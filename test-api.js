const BASE_URL = 'http://localhost:3001/api';

// Test data
let testUser = {
  email: 'test@example.com',
  password: 'password123',
  username: 'testuser'
};

let testUser2 = {
  email: 'test2@example.com',
  password: 'password123',
  username: 'testuser2'
};

let authToken = '';
let authToken2 = '';
let userId = '';
let userId2 = '';
let postId = '';
let commentId = '';

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
async function testHealthCheck() {
  console.log('\n🧪 Testing Health Check...');
  await apiCall('/test');
}

async function testRegistration() {
  console.log('\n🧪 Testing User Registration...');
  
  // Register first user
  const { data: data1 } = await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUser)
  });
  
  if (data1?.success) {
    authToken = data1.data.token;
    userId = data1.data.user.id;
    console.log('✅ User 1 registered successfully');
  } else {
    // Try to login if user already exists
    const { data: loginData } = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });
    
    if (loginData?.success) {
      authToken = loginData.data.token;
      userId = loginData.data.user.id;
      console.log('✅ User 1 logged in successfully');
    }
  }
  
  // Register second user
  const { data: data2 } = await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUser2)
  });
  
  if (data2?.success) {
    authToken2 = data2.data.token;
    userId2 = data2.data.user.id;
    console.log('✅ User 2 registered successfully');
  } else {
    // Try to login if user already exists
    const { data: loginData2 } = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testUser2.email,
        password: testUser2.password
      })
    });
    
    if (loginData2?.success) {
      authToken2 = loginData2.data.token;
      userId2 = loginData2.data.user.id;
      console.log('✅ User 2 logged in successfully');
    }
  }
}

async function testLogin() {
  console.log('\n🧪 Testing User Login...');
  
  const { data } = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password
    })
  });
  
  if (data?.success) {
    console.log('✅ Login successful');
  }
}

async function testUserProfile() {
  console.log('\n🧪 Testing User Profile...');
  
  // Get profile
  await apiCall('/users/profile', {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  
  // Update profile
  await apiCall('/users/profile', {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${authToken}` },
    body: JSON.stringify({
      bio: 'This is my updated bio!'
    })
  });
}

async function testUserById() {
  console.log('\n🧪 Testing Get User by ID...');
  
  // Get user profile by ID
  await apiCall(`/users/${userId2}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
}

async function testFollowSystem() {
  console.log('\n🧪 Testing Follow System...');
  
  // User 1 follows User 2
  await apiCall('/users/follow', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${authToken}` },
    body: JSON.stringify({ user_id: userId2 })
  });
  
  // Check if following
  await apiCall(`/users/${userId2}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  
  // Unfollow
  // await apiCall(`/users/follow?user_id=${userId2}`, {
  //   method: 'DELETE',
  //   headers: { 'Authorization': `Bearer ${authToken}` }
  // });
}

async function testPostCreation() {
  console.log('\n🧪 Testing Post Creation...');
  
  const { data } = await apiCall('/posts/create', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${authToken}` },
    body: JSON.stringify({
      content: 'This is my first post! Hello world!',
      image_url: 'https://example.com/image.jpg'
    })
  });
  
  if (data?.success) {
    postId = data.data.id;
    console.log('✅ Post created successfully');
  }
}

async function testGetPost() {
  console.log('\n🧪 Testing Get Post...');
  
  if (postId) {
    await apiCall(`/posts/${postId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
  } else {
    console.log('⚠️ Skipping get post test - no post ID available');
  }
}

async function testUpdatePost() {
  console.log('\n🧪 Testing Update Post...');
  
  if (postId) {
    await apiCall(`/posts/${postId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({
        content: 'This is my updated post!'
      })
    });
  } else {
    console.log('⚠️ Skipping update post test - no post ID available');
  }
}

async function testLikeSystem() {
  console.log('\n🧪 Testing Like System...');
  
  if (postId) {
    // Like post
    await apiCall(`/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    // Check if liked
    await apiCall(`/posts/${postId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    // Unlike post
    await apiCall(`/posts/${postId}/like`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
  } else {
    console.log('⚠️ Skipping like system test - no post ID available');
  }
}

async function testCommentSystem() {
  console.log('\n🧪 Testing Comment System...');
  
  if (postId) {
    // Create comment
    const { data } = await apiCall(`/posts/${postId}/comment`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({
        content: 'This is a great post!'
      })
    });
    
    if (data?.success) {
      commentId = data.data.id;
      console.log('✅ Comment created successfully');
    }
    
    // Get comments
    await apiCall(`/posts/${postId}/comments`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
  } else {
    console.log('⚠️ Skipping comment system test - no post ID available');
  }
}

async function testFeed() {
  console.log('\n🧪 Testing Feed...');
  
  // Follow user 2 again to see their posts in feed
  await apiCall('/users/follow', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${authToken}` },
    body: JSON.stringify({ user_id: userId2 })
  });
  
  // Create a post as user 2
  const { data } = await apiCall('/posts/create', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${authToken2}` },
    body: JSON.stringify({
      content: 'This is a post from user 2!'
    })
  });
  
  // Get feed
  await apiCall('/posts/feed', {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
}

async function testLogout() {
  console.log('\n🧪 Testing Logout...');
  
  await apiCall('/auth/logout', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting API Tests...\n');
  
  try {
    await testHealthCheck();
    await testRegistration();
    await testLogin();
    await testUserProfile();
    await testUserById();
    await testFollowSystem();
    await testPostCreation();
    await testGetPost();
    await testUpdatePost();
    await testLikeSystem();
    await testCommentSystem();
    await testFeed();
    await testLogout();
    
    console.log('\n🎉 All tests completed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runAllTests();
}

module.exports = { runAllTests };
