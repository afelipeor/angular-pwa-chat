# Angular PWA Chat Application

A modern, real-time chat application built with Angular (frontend) and NestJS (backend), featuring Progressive Web App capabilities, push notifications, and real-time messaging.

## Project Structure

```
angular-chat-app/
├── src/                          # Angular frontend
│   ├── app/
│   │   ├── auth/                 # Authentication module
│   │   ├── chat/                 # Chat module
│   │   ├── shared/               # Shared components and services
│   │   └── core/                 # Core services and guards
│   ├── assets/                   # Static assets
│   ├── environments/             # Environment configurations
│   └── index.html               # Main HTML file
├── server/                       # NestJS backend
│   ├── src/
│   │   ├── auth/                 # Authentication module
│   │   ├── users/                # User management
│   │   ├── chats/                # Chat management
│   │   ├── messages/             # Message handling
│   │   ├── notifications/        # Push notifications
│   │   ├── socket/               # WebSocket gateway
│   │   └── main.ts              # Server entry point
│   ├── test/                     # Test files
│   └── package.json             # Server dependencies
├── cypress/                      # E2E tests
├── scripts/                      # Build and deployment scripts
├── package.json                  # Frontend dependencies
└── README.md                    # This file
```

## Features

### Frontend (Angular PWA)
- 📱 **Progressive Web App** - Offline support and installable
- 💬 **Real-time Chat** - Instant messaging with WebSocket
- 🔐 **Authentication** - JWT-based login/registration
- 📱 **Push Notifications** - Browser push notifications
- 🎨 **Material Design** - Modern UI with Angular Material
- 📱 **Responsive Design** - Works on all devices
- ⚡ **Performance** - Optimized with lazy loading and OnPush

### Backend (NestJS)
- 🔐 **JWT Authentication** - Secure user authentication
- 💬 **Real-time Messaging** - WebSocket-based chat with Socket.IO
- 📱 **Push Notifications** - Web Push API integration
- 📊 **Database** - MongoDB with Mongoose ODM
- 🧪 **Testing** - Unit, integration, and E2E tests
- 📝 **API Documentation** - Interactive Swagger docs
- 🐳 **Docker Support** - Containerized deployment

## Quick Start

### Prerequisites
- Node.js (18.x or higher)
- MongoDB (6.0 or higher)
- npm or yarn

### Development Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd angular-chat-app
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Install backend dependencies:**
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Set up environment variables:**
   ```bash
   # Copy and configure frontend environment
   cp src/environments/environment.example.ts src/environments/environment.ts

   # Copy and configure backend environment
   cp server/.env.example server/.env
   ```

5. **Start development servers:**
   ```bash
   # Terminal 1: Start backend
   cd server
   npm run start:dev

   # Terminal 2: Start frontend
   cd ..
   npm start
   ```

### Access the Application
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs

## Available Scripts

### Frontend Scripts
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run e2e` - Run end-to-end tests
- `npm run lint` - Lint code
- `npm run format` - Format code

### Backend Scripts
- `npm run start:dev` - Start development server
- `npm run build` - Build the application
- `npm test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:cov` - Run tests with coverage

## Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment
```bash
# Build frontend
npm run build

# Build backend
cd server
npm run build

# Start production server
npm run start:prod
```

## API Documentation

The backend provides a complete REST API documented with Swagger. Once the server is running, visit:
- **Swagger UI**: http://localhost:3000/api/docs

### Main API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

#### Users
- `GET /api/users` - Get all users
- `GET /api/users/profile` - Get current user profile
- `PATCH /api/users/profile` - Update user profile

#### Chats
- `GET /api/chats` - Get user's chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/:id` - Get chat details

#### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/chat/:chatId` - Get chat messages

## WebSocket Events

### Client to Server
- `sendMessage` - Send a new message
- `joinChat` - Join a chat room
- `typing` - Send typing indicator

### Server to Client
- `newMessage` - Receive new message
- `userStatusUpdate` - User online/offline status
- `userTyping` - Typing indicator

## Testing

Run the complete test suite:

```bash
# Frontend tests
npm test
npm run e2e

# Backend tests
cd server
npm test
npm run test:e2e
npm run test:cov
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Technology Stack

### Frontend
- **Angular 17+** - Frontend framework
- **Angular Material** - UI component library
- **RxJS** - Reactive programming
- **Socket.IO Client** - Real-time communication
- **PWA** - Progressive Web App features

### Backend
- **NestJS** - Node.js framework
- **Socket.IO** - WebSocket library
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Web Push** - Push notifications

### Development Tools
- **TypeScript** - Programming language
- **Jest** - Testing framework
- **Cypress** - E2E testing
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Docker** - Containerization

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
