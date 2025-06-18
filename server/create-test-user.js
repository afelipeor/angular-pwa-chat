const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function createTestUser() {
  try {
    console.log('📝 Creating test user...');
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test User',
      email: 'test@test.com',
      password: 'password123',
    });

    console.log('✅ Test user created successfully:', response.data);

    // Now login to get token
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@test.com',
      password: 'password123',
    });

    console.log('✅ Login successful:', loginResponse.data);
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ️  Test user already exists, trying to login...');
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'test@test.com',
        password: 'password123',
      });
      console.log('✅ Login successful:', loginResponse.data);
    } else {
      console.error('❌ Error:', error.response?.data || error.message);
    }
  }
}

createTestUser();
