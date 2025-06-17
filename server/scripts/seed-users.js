/**
 * Simple script to seed test users
 * Run this once to create test users for development
 */

const testUsers = [
  {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'password123',
  },
  {
    name: 'Bob Smith',
    email: 'bob@example.com',
    password: 'password123',
  },
  {
    name: 'Carol Davis',
    email: 'carol@example.com',
    password: 'password123',
  },
  {
    name: 'David Wilson',
    email: 'david@example.com',
    password: 'password123',
  },
  {
    name: 'Emma Brown',
    email: 'emma@example.com',
    password: 'password123',
  },
  {
    name: 'Frank Miller',
    email: 'frank@example.com',
    password: 'password123',
  },
];

async function seedUsers() {
  console.log('Seeding test users...');
  const baseUrl = 'http://localhost:3001/api';

  for (const user of testUsers) {
    try {
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });

      if (response.ok) {
        console.log(`✓ Created user: ${user.name} (${user.email})`);
      } else {
        const error = await response.text();
        console.log(`- User ${user.email} might already exist: ${error}`);
      }
    } catch (error) {
      console.error(`✗ Error creating user ${user.email}:`, error.message);
    }
  }

  console.log('Seeding complete!');
}

// Only run if this file is executed directly
if (require.main === module) {
  seedUsers().catch(console.error);
}

module.exports = { seedUsers, testUsers };
