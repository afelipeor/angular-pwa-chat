const axios = require('axios');
const { io } = require('socket.io-client');

const BASE_URL = 'http://localhost:3001/api';

async function testAutoResponse() {
  try {
    console.log('Testing auto-response functionality...'); // 1. Login as test user
    console.log('1. Logging in as alice...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'alice@example.com',
      password: 'password123',
    });
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log(`Logged in as: ${user.name} (${user.id})`);

    // 2. Get user's chats
    console.log('2. Getting user chats...');
    const chatsResponse = await axios.get(`${BASE_URL}/chats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (chatsResponse.data.length === 0) {
      console.log('No chats found. Create a chat first.');
      return;
    }

    const chat = chatsResponse.data[0];
    console.log(`Using chat: ${chat.name} (${chat._id})`);

    // 3. Connect to WebSocket
    console.log('3. Connecting to WebSocket...');
    const socket = io('http://localhost:3001', {
      auth: { token: token },
      transports: ['websocket'],
    });

    let messageReceived = false;
    let autoResponseReceived = false;

    // Listen for connection
    socket.on('connect', () => {
      console.log('✓ Connected to WebSocket');

      // Join the chat
      socket.emit('joinChat', { chatId: chat._id });
    });

    // Listen for new messages
    socket.on('newMessage', (message) => {
      console.log(
        `📩 New message from ${message.sender.name}: ${message.content}`
      );

      if (message.sender.name === 'ChatBot') {
        autoResponseReceived = true;
        console.log('✓ Auto-response received!');
        console.log('Test completed successfully!');
        socket.disconnect();
        process.exit(0);
      } else {
        messageReceived = true;
        console.log(
          '✓ Original message confirmed, waiting for auto-response...'
        );
      }
    });

    // Wait for connection then send a message
    setTimeout(() => {
      console.log('4. Sending test message...');
      socket.emit('sendMessage', {
        chatId: chat._id,
        content: 'Hello! Testing auto-response functionality.',
        type: 'text',
      });
    }, 1000);

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!autoResponseReceived) {
        console.log('❌ Auto-response not received within 10 seconds');
        console.log(`Message received: ${messageReceived}`);
        console.log(`Auto-response received: ${autoResponseReceived}`);
      }
      socket.disconnect();
      process.exit(1);
    }, 10000);

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testAutoResponse();
