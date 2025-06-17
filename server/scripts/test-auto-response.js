const { io } = require('socket.io-client');
const axios = require('axios');

const API_BASE = 'http://localhost:3001';

async function testAutoResponse() {
  try {
    console.log('🔐 Getting authentication token...'); // Login to get a token
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: 'alice@example.com',
      password: 'password123',
    });
    const token = loginResponse.data.access_token;
    console.log('✅ Token received'); // Get user chats
    const chatsResponse = await axios.get(`${API_BASE}/api/chats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (chatsResponse.data.length === 0) {
      console.log('❌ No chats found. Please create a chat first.');
      return;
    }

    const chat = chatsResponse.data[0];
    console.log(`💬 Using chat: ${chat.name || 'Unnamed'} (ID: ${chat._id})`);

    // Connect to WebSocket
    console.log('🔗 Connecting to WebSocket...');
    const socket = io('http://localhost:3001', {
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected');

      // Join the chat
      socket.emit('joinChat', { chatId: chat._id });

      // Listen for new messages
      socket.on('newMessage', (message) => {
        console.log(
          `📨 New message received: ${message.content} (from: ${message.sender?.name || 'Unknown'})`
        );

        // Check if this is an auto-response (from bot)
        if (message.sender?.email === 'chatbot@angular-chat.com') {
          console.log('🤖 Auto-response received!');
        }
      });

      // Send a test message after a short delay
      setTimeout(() => {
        console.log('📤 Sending test message...');
        socket.emit('sendMessage', {
          chatId: chat._id,
          content: 'Hello! This is a test message to trigger auto-response.',
          type: 'text',
        });
      }, 1000);

      // Wait for auto-response (should come after 2 seconds)
      setTimeout(() => {
        console.log(
          '🏁 Test completed. Check the logs above for auto-response.'
        );
        socket.disconnect();
        process.exit(0);
      }, 5000);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testAutoResponse();
