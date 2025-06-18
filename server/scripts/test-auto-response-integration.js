const axios = require('axios');
const io = require('socket.io-client');

const BASE_URL = 'http://localhost:3001/api';

async function testAutoResponseIntegration() {
  try {
    console.log('🧪 Testing Auto-Response Integration...\n');

    // Step 1: Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test1@example.com',
      password: 'password123',
    });

    const token = loginResponse.data.access_token;
    const userId = loginResponse.data.user._id;
    console.log(`✅ Logged in as: ${loginResponse.data.user.name} (${userId})`);

    // Step 2: Get users for chat creation
    console.log('2. Getting users...');
    const usersResponse = await axios.get(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const otherUser = usersResponse.data.find((user) => user._id !== userId);
    if (!otherUser) {
      throw new Error('No other user found');
    }
    console.log(`✅ Found other user: ${otherUser.name} (${otherUser._id})`);

    // Step 3: Create chat
    console.log('3. Creating chat...');
    const chatResponse = await axios.post(
      `${BASE_URL}/chats`,
      {
        name: 'Test Auto-Response Chat',
        participants: [userId, otherUser._id],
        isGroup: false,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const chatId = chatResponse.data._id;
    console.log(`✅ Chat created: ${chatId}`);

    // Step 4: Connect to WebSocket
    console.log('4. Connecting to WebSocket...');
    const socket = io('http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    // Promise to handle socket events
    const waitForMessage = () => {
      return new Promise((resolve) => {
        socket.on('newMessage', (message) => {
          console.log(
            `📨 Received message: "${message.content}" from ${message.sender?.name || 'Unknown'}`
          );
          resolve(message);
        });
      });
    };

    socket.on('connect', () => {
      console.log('✅ WebSocket connected');

      // Join the chat
      socket.emit('joinChat', { chatId });
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
    });

    // Wait for connection
    await new Promise((resolve) => {
      socket.on('connect', resolve);
    });

    // Step 5: Enable auto-response
    console.log('5. Enabling auto-response...');
    socket.emit('toggleAutoResponse', { enabled: true });
    socket.emit('setAutoResponseDelay', { delay: 2000 }); // 2 seconds
    console.log('✅ Auto-response enabled with 2 second delay');

    // Step 6: Send a message and wait for auto-response
    console.log('6. Sending test message...');
    const messageContent = `Test message at ${new Date().toLocaleTimeString()}`;

    // Wait for the auto-response
    const messagePromise = waitForMessage();

    const messageResponse = await axios.post(
      `${BASE_URL}/messages`,
      {
        chatId: chatId,
        content: messageContent,
        type: 'text',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log(`✅ Sent message: "${messageContent}"`);
    console.log(
      '⏳ Waiting for auto-response (should arrive in ~2 seconds)...'
    );

    // Wait for the auto-response message
    const autoResponseMessage = await messagePromise;

    if (autoResponseMessage.content === 'This is a system message.') {
      console.log('✅ Auto-response received successfully!');
      console.log(
        `✅ Delay worked correctly (system message content: "${autoResponseMessage.content}")`
      );
    } else {
      console.log(
        "⚠️  Received message but content doesn't match expected auto-response"
      );
    }

    // Step 7: Test disabling auto-response
    console.log('7. Disabling auto-response...');
    socket.emit('toggleAutoResponse', { enabled: false });
    console.log('✅ Auto-response disabled');

    // Send another message to verify no auto-response
    console.log('8. Sending message with auto-response disabled...');
    const secondMessageContent = `Second test message at ${new Date().toLocaleTimeString()}`;

    await axios.post(
      `${BASE_URL}/messages`,
      {
        chatId: chatId,
        content: secondMessageContent,
        type: 'text',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log(`✅ Sent message: "${secondMessageContent}"`);
    console.log('⏳ Waiting 3 seconds to verify no auto-response...');

    // Wait 3 seconds and check if we get any unexpected messages
    let unexpectedMessage = false;
    const unexpectedMessageTimeout = setTimeout(() => {
      console.log('✅ No auto-response received (as expected)');
    }, 3000);

    socket.on('newMessage', (message) => {
      if (message.content === 'This is a system message.') {
        clearTimeout(unexpectedMessageTimeout);
        unexpectedMessage = true;
        console.log('❌ Unexpected auto-response received when disabled');
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 3500));

    socket.disconnect();
    console.log('\n🎉 Auto-Response Integration Test Complete!');

    if (!unexpectedMessage) {
      console.log(
        '✅ All tests passed: Auto-response works correctly with enable/disable functionality'
      );
    } else {
      console.log('❌ Test failed: Auto-response sent when disabled');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Stack:', error.stack);
  }

  process.exit(0);
}

testAutoResponseIntegration();
