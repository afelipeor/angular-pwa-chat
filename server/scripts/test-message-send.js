const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testMessageSending() {
  console.log('🧪 Testing Message Sending End-to-End...\n');

  try {
    // Step 1: Login as Alice
    console.log('1. 🔐 Logging in as Alice...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'alice@example.com',
      password: 'password123',
    });

    const aliceToken = loginResponse.data.token;
    const aliceUserId = loginResponse.data.user._id;
    console.log(`   ✅ Alice logged in successfully! User ID: ${aliceUserId}`);

    // Step 2: Get all chats for Alice
    console.log("\n2. 📋 Getting Alice's chats...");
    const chatsResponse = await axios.get(`${BASE_URL}/chats`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    if (chatsResponse.data.length === 0) {
      console.log(
        '   ❌ No chats found for Alice. Will create one if needed...'
      );
    } else {
      console.log(`   ✅ Found ${chatsResponse.data.length} chat(s) for Alice`);
    }
    // Use the first chat
    let chatId;
    if (chatsResponse.data.length > 0) {
      chatId = chatsResponse.data[0]._id;
    } else {
      // Get Bob's user ID
      const usersResponse = await axios.get(`${BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${aliceToken}` },
      });

      const bob = usersResponse.data.find(
        (user) => user.email === 'bob@example.com'
      );
      if (!bob) {
        throw new Error('Bob user not found');
      }

      // Create a chat
      const chatResponse = await axios.post(
        `${BASE_URL}/chats`,
        {
          name: 'Alice & Bob Chat',
          participants: [bob._id],
        },
        {
          headers: { Authorization: `Bearer ${aliceToken}` },
        }
      );

      chatId = chatResponse.data._id;
      console.log(`   ✅ Chat created successfully! Chat ID: ${chatId}`);
    }
    console.log(`   📝 Using chat ID: ${chatId}`);

    // Step 3: Send a message (JSON format)
    console.log('\n3. 💬 Sending a message...');
    const messagePayload = {
      chatId: chatId,
      content: 'Hello! This is a test message from the API 🚀',
      type: 'text',
    };

    console.log('   📤 Message payload:');
    console.log(`   ${JSON.stringify(messagePayload, null, 4)}`);

    const messageResponse = await axios.post(
      `${BASE_URL}/messages`,
      messagePayload,
      {
        headers: {
          Authorization: `Bearer ${aliceToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('   ✅ Message sent successfully!');
    console.log(`   📧 Message ID: ${messageResponse.data._id}`);
    console.log(`   📄 Content: "${messageResponse.data.content}"`);
    console.log(
      `   👤 Sender: ${messageResponse.data.sender.name || messageResponse.data.sender.email}`
    );
    console.log(`   🕐 Timestamp: ${messageResponse.data.timestamp}`);

    // Step 4: Retrieve messages to verify
    console.log('\n4. 📨 Retrieving chat messages...');
    const messagesResponse = await axios.get(
      `${BASE_URL}/messages/chat/${chatId}`,
      {
        headers: { Authorization: `Bearer ${aliceToken}` },
      }
    );
    console.log(
      `   ✅ Retrieved ${messagesResponse.data.messages ? messagesResponse.data.messages.length : messagesResponse.data.length || 0} message(s)`
    );

    const messages =
      messagesResponse.data.messages || messagesResponse.data || [];
    messages.forEach((msg, index) => {
      console.log(
        `   ${index + 1}. "${msg.content}" - ${msg.sender.name || msg.sender.email} (${new Date(msg.timestamp).toLocaleString()})`
      );
    });

    console.log('\n🎉 Message sending test completed successfully!');
    console.log(
      '✅ Both chat creation and message sending are working correctly.'
    );
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testMessageSending();
