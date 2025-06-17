const axios = require('axios');

async function testDirectAPI() {
  try {
    // Login
    console.log('Logging in...');
    const loginResponse = await axios.post(
      'http://localhost:3001/api/auth/login',
      {
        email: 'alice@example.com',
        password: 'password123',
      }
    );
    console.log('Login response:', loginResponse.data);
    const token = loginResponse.data.token;

    // Test getting profile
    console.log('\nTesting profile...');
    const profileResponse = await axios.get(
      'http://localhost:3001/api/users/profile',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log('Profile response:', profileResponse.data);

    // Test getting all users
    console.log('\nTesting users list...');
    const usersResponse = await axios.get('http://localhost:3001/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`Found ${usersResponse.data.length} users`);
    usersResponse.data.forEach((user) => {
      console.log(
        `- ${user.name} (${user.email}) - ID: ${user._id || user.id}`
      );
    });

    // Try to create a chat
    console.log('\nTesting chat creation...');
    const bobUser = usersResponse.data.find(
      (u) => u.email === 'bob@example.com'
    );
    if (!bobUser) {
      console.error('Bob user not found');
      return;
    }

    console.log('Bob user:', bobUser);
    console.log('Bob user ID:', bobUser._id || bobUser.id);
    const chatResponse = await axios.post(
      'http://localhost:3001/api/chats',
      {
        name: 'Test Chat',
        participants: [bobUser._id],
        isGroup: false,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log('Chat creation response:', chatResponse.data);
  } catch (error) {
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
    });
  }
}

testDirectAPI();
