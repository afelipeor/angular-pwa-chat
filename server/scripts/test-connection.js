const axios = require('axios');
const { io } = require('socket.io-client');

async function testConnection() {
  try {
    console.log('Logging in...');
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'alice@example.com',
      password: 'password123',
    });

    const token = response.data.token;
    console.log('Token received, connecting to WebSocket...');

    const socket = io('http://localhost:3001', {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket');

      // Wait a moment then disconnect
      setTimeout(() => {
        socket.disconnect();
        process.exit(0);
      }, 2000);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testConnection();
