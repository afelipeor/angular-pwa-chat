const axios = require('axios');
const { io } = require('socket.io-client');

const BASE_URL = 'http://localhost:3001/api';

async function testAutoResponseDirectly() {
  try {
    console.log('🚀 Testing auto-response directly...\n');

    // Step 1: Login as Alice
    console.log('1️⃣ Logging in as Alice...');
    const aliceResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'alice@example.com',
      password: 'password123',
    });

    const aliceToken = aliceResponse.data.token;
    const aliceUserId = aliceResponse.data.user.id;
    console.log(`✅ Alice logged in (ID: ${aliceUserId})`);

    // Step 2: Get Alice's existing chats
    console.log("2️⃣ Getting Alice's chats...");
    const chatsResponse = await axios.get(`${BASE_URL}/chats`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });

    console.log(`Found ${chatsResponse.data.length} chats:`);
    chatsResponse.data.forEach((chat, index) => {
      const participantNames = chat.participants.map((p) => p.name).join(', ');
      console.log(
        `  ${index + 1}. ${chat.name || 'Unnamed'} (${participantNames}) - ID: ${chat._id}`
      );
    });

    if (chatsResponse.data.length === 0) {
      console.log('❌ No chats found. Please create a chat first.');
      return;
    }

    // Use the first chat
    const chat = chatsResponse.data[0];
    const chatId = chat._id;
    console.log(`\n3️⃣ Using chat: ${chat.name || 'Unnamed'} (ID: ${chatId})`);

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

      // Wait for authentication to complete before joining chat
      setTimeout(() => {
        console.log('5️⃣ Joining chat...');
        socket.emit('joinChat', { chatId }, (response) => {
          if (response?.success) {
            console.log('✅ Alice joined the chat successfully');

            // Send a test message after joining
            setTimeout(() => {
              console.log('6️⃣ Alice sending test message...');
              const testMessage =
                'Hello! This should trigger an auto-response from the bot.';
              socket.emit(
                'sendMessage',
                {
                  chatId,
                  content: testMessage,
                  type: 'text',
                },
                (messageResponse) => {
                  if (messageResponse?.success) {
                    console.log('✅ Message sent successfully');
                    console.log(
                      '⏳ Waiting for auto-response (should arrive in ~2 seconds)...'
                    );
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
      }, 1000); // Wait 1 second for authentication to complete
    });

    socket.on('newMessage', (message) => {
      messageCount++;
      console.log(`📨 Message ${messageCount} received:`);
      console.log(`   From: ${message.sender.name} (${message.sender.email})`);
      console.log(`   Content: "${message.content}"`);
      console.log(
        `   Time: ${new Date(message.createdAt).toLocaleTimeString()}`
      );

      if (message.sender.email === 'chatbot@angular-chat.com') {
        botMessageReceived = true;
        console.log('🤖 AUTO-RESPONSE RECEIVED! Bot is working!');
      }
      console.log('');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
    });

    // Wait for potential auto-response
    setTimeout(() => {
      console.log(`📊 Final Results:`);
      console.log(`   Total messages received: ${messageCount}`);
      console.log(
        `   Bot message received: ${botMessageReceived ? '✅ YES' : '❌ NO'}`
      );

      if (!botMessageReceived) {
        console.log('\n🔍 Auto-response not working. This could be due to:');
        console.log('   - Auto-response feature is disabled');
        console.log('   - Bot user creation failed');
        console.log('   - Error in the sendAutoResponse method');
        console.log('   - WebSocket message handling issue');
      }

      socket.disconnect();

      // Check chat messages via API
      checkChatMessages(chatId, aliceToken);
    }, 10000); // Wait 10 seconds for auto-response
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

    console.log(`📋 Chat has ${messagesResponse.data.length} total messages:`);

    // Show last 5 messages
    const recentMessages = messagesResponse.data.slice(-5);
    recentMessages.forEach((msg, index) => {
      const isBot = msg.sender.email === 'chatbot@angular-chat.com';
      console.log(
        `  ${index + 1}. ${msg.sender.name}${isBot ? ' 🤖' : ''}: "${msg.content}"`
      );
      console.log(`     Time: ${new Date(msg.createdAt).toLocaleTimeString()}`);
    });

    const botMessages = messagesResponse.data.filter(
      (msg) => msg.sender.email === 'chatbot@angular-chat.com'
    );
    console.log(`\n🤖 Total bot messages in chat: ${botMessages.length}`);

    process.exit(0);
  } catch (error) {
    console.error(
      '❌ Error fetching messages:',
      error.response?.data || error.message
    );
    process.exit(1);
  }
}

testAutoResponseDirectly().catch(console.error);
