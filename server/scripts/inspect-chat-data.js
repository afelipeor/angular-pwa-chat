const axios = require('axios');

async function inspectChatData() {
  try {
    console.log('🔍 Inspecting chat data...\n');

    // Login
    const aliceResponse = await axios.post(
      'http://localhost:3001/api/auth/login',
      {
        email: 'alice@example.com',
        password: 'password123',
      }
    );

    const aliceToken = aliceResponse.data.token;
    const aliceUserId = aliceResponse.data.user.id;
    console.log(`Alice ID: ${aliceUserId}\n`);

    // Get chats
    const chatsResponse = await axios.get('http://localhost:3001/api/chats', {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });

    console.log(`Found ${chatsResponse.data.length} chats:\n`);

    for (let i = 0; i < chatsResponse.data.length; i++) {
      const chat = chatsResponse.data[i];
      console.log(`Chat ${i + 1}: ${chat.name || 'Unnamed'}`);
      console.log(`  ID: ${chat._id}`);
      console.log(`  Participants:`, chat.participants);
      console.log(`  Created by: ${chat.createdBy}`);
      console.log(`  Is Group: ${chat.isGroup}`);

      // Check if Alice is in participants
      const aliceInChat = chat.participants.some(
        (p) => (typeof p === 'string' ? p : p._id) === aliceUserId
      );
      console.log(`  Alice is participant: ${aliceInChat}`);
      console.log('');

      // Try to get this specific chat to see detailed info
      try {
        const chatDetailsResponse = await axios.get(
          `http://localhost:3001/api/chats/${chat._id}`,
          {
            headers: { Authorization: `Bearer ${aliceToken}` },
          }
        );
        console.log(
          `  Detailed participants:`,
          chatDetailsResponse.data.participants
        );
        console.log('');
      } catch (error) {
        console.log(
          `  Error getting chat details: ${error.response?.data?.message || error.message}`
        );
        console.log('');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

inspectChatData();
