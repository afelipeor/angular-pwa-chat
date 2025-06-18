const axios = require('axios');

async function testAutoResponse() {
  try {
    // First login to get a token
    const loginResponse = await axios.post(
      'http://localhost:3001/api/auth/login',
      {
        email: 'alice@example.com',
        password: 'password123',
      }
    );

    const token = loginResponse.data.token;
    console.log('✅ Login successful, token:', token.substring(0, 20) + '...');

    // Get user's chats
    const chatsResponse = await axios.get('http://localhost:3001/api/chats', {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('✅ Got chats:', chatsResponse.data.length);

    if (chatsResponse.data.length === 0) {
      console.log('❌ No chats found');
      return;
    }

    const chatId = chatsResponse.data[0]._id;
    console.log('📱 Using chat ID:', chatId);

    // Send a message to trigger auto-response
    const messageResponse = await axios.post(
      'http://localhost:3001/api/messages',
      {
        chatId: chatId,
        content: 'Hello, this should trigger an auto-response!',
        type: 'text',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log('✅ Message sent:', messageResponse.data._id);

    // Wait a bit for auto-response
    console.log('⏳ Waiting 3 seconds for auto-response...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Get messages from the chat to see if auto-response was added
    const messagesResponse = await axios.get(
      `http://localhost:3001/api/messages/chat/${chatId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log('📨 Messages in chat:');
    messagesResponse.data.forEach((msg, index) => {
      console.log(
        `${index + 1}. From: ${msg.sender?.name || 'Unknown'} - Content: "${msg.content}" - Type: ${msg.type} - ChatId: ${msg.chatId || msg.chat?._id || msg.chat || 'undefined'}`
      );
      // Show raw message structure for debugging
      if (index === 0) {
        console.log('🔍 Raw message structure:', JSON.stringify(msg, null, 2));
      }
    });
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAutoResponse();
