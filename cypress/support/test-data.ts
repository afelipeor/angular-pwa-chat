// cypress/support/test-data.ts
export const testUsers = {
  testUser: {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    status: 'online',
    avatar: 'https://ui-avatars.com/api/?name=Test+User',
  },
  janeSmith: {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    status: 'online',
    avatar: 'https://ui-avatars.com/api/?name=Jane+Smith',
  },
};

export const testChats = [
  {
    id: '1',
    name: 'General Chat',
    participants: [testUsers.testUser, testUsers.janeSmith],
    lastMessage: {
      id: '1',
      content: 'Hello everyone!',
      sender: testUsers.testUser,
      timestamp: '2024-01-15T10:30:00Z',
    },
    unreadCount: 2,
    isGroup: true,
  },
];
