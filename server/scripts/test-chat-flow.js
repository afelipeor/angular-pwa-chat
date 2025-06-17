/**
 * Simple test to verify the new chat creation flow
 */

async function testNewChatFlow() {
  const baseUrl = 'http://localhost:3000/api';

  try {
    // 1. Login as test user
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✓ Login successful');

    // 2. Get users list
    console.log('2. Getting users list...');
    const usersResponse = await fetch(`${baseUrl}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!usersResponse.ok) {
      throw new Error(`Users fetch failed: ${usersResponse.status}`);
    }

    const users = await usersResponse.json();
    console.log(
      `✓ Found ${users.length} users:`,
      users.map((u) => u.name)
    );

    // 3. Create a new chat
    console.log('3. Creating new chat...');
    if (users.length === 0) {
      throw new Error('No users found to create chat with');
    }

    const otherUser = users.find((u) => u.email !== 'test@example.com');
    if (!otherUser) {
      throw new Error('No other users found to create chat with');
    }

    const createChatResponse = await fetch(`${baseUrl}/chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: `Chat with ${otherUser.name}`,
        participants: [otherUser._id],
        isGroup: false,
      }),
    });

    if (!createChatResponse.ok) {
      const errorText = await createChatResponse.text();
      throw new Error(
        `Chat creation failed: ${createChatResponse.status} - ${errorText}`
      );
    }

    const newChat = await createChatResponse.json();
    console.log('✓ Chat created successfully:', newChat);

    // 4. Verify chat can be fetched
    console.log('4. Verifying chat can be fetched...');
    const getChatResponse = await fetch(`${baseUrl}/chats/${newChat._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!getChatResponse.ok) {
      throw new Error(`Chat fetch failed: ${getChatResponse.status}`);
    }

    const fetchedChat = await getChatResponse.json();
    console.log('✓ Chat fetched successfully:', fetchedChat);

    console.log(
      '\n🎉 All tests passed! New chat creation flow works correctly.'
    );
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNewChatFlow();
