const axios = require('axios');
const { io } = require('socket.io-client');

const BASE_URL = 'http://localhost:3001/api';

async function testChatFlow() {
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@test.com',
      password: 'password123',
    });

    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log(`✅ Logged in as ${user.name} (${user.id})`);
    console.log(`Token: ${token.substring(0, 20)}...`);

    // Get chats
    console.log('\n📋 Getting chats...');
    const chatsResponse = await axios.get(`${BASE_URL}/chats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (chatsResponse.data.length === 0) {
      console.log('❌ No chats found. Please create a chat first.');
      return;
    }

    const chat = chatsResponse.data[0];
    console.log(`💬 Using chat: ${chat.name || 'Unnamed'} (ID: ${chat._id})`);

    // Connect to WebSocket
    console.log('\n🔗 Connecting to WebSocket...');
    const socket = io('http://localhost:3001', {
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected');

      // Join chat
      console.log(`📥 Joining chat ${chat._id}...`);
      socket.emit('joinChat', { chatId: chat._id });

      // Send a test message
      setTimeout(() => {
        console.log('\n📤 Sending test message...');
        socket.emit('sendMessage', {
          chatId: chat._id,
          content: 'Test message from script',
          type: 'text',
        });
      }, 1000);
    });

    socket.on('newMessage', (message) => {
      console.log('\n📨 Received new message:');
      console.log(`From: ${message.sender.name} (${message.sender._id})`);
      console.log(`Content: ${message.content}`);
      console.log(
        `Is system message: ${
          message.sender.email && message.sender.email.includes('bot')
        }`
      );
      console.log(`Current user ID: ${user.id}`);
      console.log(`Sender ID: ${message.sender._id}`);
      console.log(`Is own message: ${user.id === message.sender._id}`);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
    });

    // Keep script running
    setTimeout(() => {
      console.log('\n🔚 Test completed');
      socket.disconnect();
      process.exit(0);
    }, 10000);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testChatFlow();
