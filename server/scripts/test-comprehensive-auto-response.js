const axios = require('axios');
const { io } = require('socket.io-client');

const BASE_URL = 'http://localhost:3001/api';

async function createTestData() {
  try {
    console.log('🚀 Creating test setup for auto-response...\n');

    // Step 1: Login as Alice
    console.log('1️⃣ Logging in as Alice...');
    const aliceResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'alice@example.com',
      password: 'password123',
    });
    const aliceToken = aliceResponse.data.token;
    const aliceUserId = aliceResponse.data.user.id;
    console.log(`✅ Alice logged in (ID: ${aliceUserId})`);

    // Step 2: Login as Bob
    console.log('2️⃣ Logging in as Bob...');
    const bobResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'bob@example.com',
      password: 'password123',
    });
    const bobToken = bobResponse.data.token;
    const bobUserId = bobResponse.data.user.id;
    console.log(`✅ Bob logged in (ID: ${bobUserId})`);

    // Step 3: Create a chat between Alice and Bob (if not exists)
    console.log('3️⃣ Creating chat between Alice and Bob...');
    let chatId;
    try {
      const chatResponse = await axios.post(
        `${BASE_URL}/chats`,
        {
          name: 'Auto-Response Test Chat',
          participants: [bobUserId],
          isGroup: false,
        },
        {
          headers: { Authorization: `Bearer ${aliceToken}` },
        }
      );
      chatId = chatResponse.data._id;
      console.log(`✅ Chat created with ID: ${chatId}`);
    } catch (error) {
      if (error.response?.status === 409) {
        // Chat already exists, get existing chats
        const chatsResponse = await axios.get(`${BASE_URL}/chats`, {
          headers: { Authorization: `Bearer ${aliceToken}` },
        });
        // Find chat with Bob
        const existingChat = chatsResponse.data.find((chat) =>
          chat.participants.some((p) => p._id === bobUserId)
        );

        if (existingChat) {
          chatId = existingChat._id;
          console.log(`✅ Using existing chat with ID: ${chatId}`);
        } else {
          throw new Error('No chat found between Alice and Bob');
        }
      } else {
        throw error;
      }
    }

    // Step 4: Connect Alice to WebSocket
    console.log('4️⃣ Connecting Alice to WebSocket...');
    const socket = io('http://localhost:3001', {
      auth: { token: aliceToken },
      transports: ['websocket'],
    });

    let messageCount = 0;
    let botMessageReceived = false;

    socket.on('connect', () => {
      console.log('✅ Alice connected to WebSocket');

      // Join the chat
      socket.emit('joinChat', { chatId }, (response) => {
        if (response?.success) {
          console.log('✅ Alice joined the chat');

          // Send a test message after joining
          setTimeout(() => {
            console.log('📤 Alice sending test message...');
            socket.emit(
              'sendMessage',
              {
                chatId,
                content:
                  'Hello! This should trigger an auto-response from the bot.',
                type: 'text',
              },
              (messageResponse) => {
                if (messageResponse?.success) {
                  console.log('✅ Message sent successfully');
                } else {
                  console.error(
                    '❌ Failed to send message:',
                    messageResponse?.error
                  );
                }
              }
            );
          }, 1000);
        } else {
          console.error('❌ Failed to join chat:', response?.error);
        }
      });
    });

    socket.on('newMessage', (message) => {
      messageCount++;
      console.log(`📨 Message ${messageCount} received:`, {
        id: message._id,
        content: message.content,
        sender: message.sender.name,
        senderEmail: message.sender.email,
        isBot: message.sender.email === 'chatbot@angular-chat.com',
      });

      if (message.sender.email === 'chatbot@angular-chat.com') {
        botMessageReceived = true;
        console.log('🤖 Auto-response received! Bot is working!');
      }
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
    });

    // Wait for potential auto-response
    setTimeout(() => {
      console.log(`\n📊 Test Results:`);
      console.log(`   Total messages received: ${messageCount}`);
      console.log(
        `   Bot message received: ${botMessageReceived ? '✅ YES' : '❌ NO'}`
      );

      if (!botMessageReceived) {
        console.log('\n🔍 Checking server logs for any errors...');
      }

      socket.disconnect();

      // Check chat messages via API
      checkChatMessages(chatId, aliceToken);
    }, 6000); // Wait 6 seconds for auto-response
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

async function checkChatMessages(chatId, token) {
  try {
    console.log('\n🔍 Checking chat messages via API...');
    const messagesResponse = await axios.get(
      `${BASE_URL}/messages/chat/${chatId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log(`📋 Chat has ${messagesResponse.data.length} messages:`);
    messagesResponse.data.forEach((msg, index) => {
      console.log(
        `  ${index + 1}. ${msg.sender.name} (${msg.sender.email}): "${msg.content}"`
      );
    });

    const botMessages = messagesResponse.data.filter(
      (msg) => msg.sender.email === 'chatbot@angular-chat.com'
    );
    console.log(`\n🤖 Bot messages found: ${botMessages.length}`);

    process.exit(0);
  } catch (error) {
    console.error(
      '❌ Error fetching messages:',
      error.response?.data || error.message
    );
    process.exit(1);
  }
}

createTestData().catch(console.error);
