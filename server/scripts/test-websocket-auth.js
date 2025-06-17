const axios = require('axios');
const { io } = require('socket.io-client');

const BASE_URL = 'http://localhost:3000/api';

async function testWebSocketAuth() {
  try {
    console.log('🧪 Testing WebSocket Authentication...');

    // 1. Login to get a fresh token
    console.log('1. 🔐 Logging in as Alice...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'alice@example.com',
      password: 'password123',
    });

    console.log(
      '   📋 Login response:',
      JSON.stringify(loginResponse.data, null, 2)
    );

    const token =
      loginResponse.data.access_token ||
      loginResponse.data.accessToken ||
      loginResponse.data.token;
    if (!token) {
      throw new Error('No access token received');
    }
    console.log(
      `   ✅ Alice logged in successfully! Token: ${token.substring(0, 20)}...`
    );

    // 2. Connect to WebSocket with the token
    console.log('2. 🌐 Connecting to WebSocket...');
    const socket = io('http://localhost:3000', {
      auth: {
        token: token,
      },
      transports: ['websocket'],
    });

    // Handle connection events
    socket.on('connect', () => {
      console.log('   ✅ WebSocket connected successfully!');
      console.log(`   📡 Socket ID: ${socket.id}`);

      // Test complete, disconnect
      setTimeout(() => {
        socket.disconnect();
        console.log('🎉 WebSocket authentication test completed successfully!');
        process.exit(0);
      }, 2000);
    });

    socket.on('connect_error', (error) => {
      console.error('   ❌ WebSocket connection failed:', error.message);
      process.exit(1);
    });

    socket.on('disconnect', (reason) => {
      console.log(`   📴 WebSocket disconnected: ${reason}`);
    });
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testWebSocketAuth();
