"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt_1 = require("@nestjs/jwt");
const testing_1 = require("@nestjs/testing");
const chats_service_1 = require("../chats/chats.service");
const messages_service_1 = require("../messages/messages.service");
const users_service_1 = require("../users/users.service");
const socket_gateway_1 = require("./socket.gateway");
describe('SocketGateway', () => {
    let gateway;
    let mockJwtService;
    let mockUsersService;
    let mockChatsService;
    let mockMessagesService;
    const mockUser = {
        _id: '60a6c8b8b4f1a8001f6b1234',
        name: 'John Doe',
        email: 'john@example.com',
        status: 'online',
    };
    const mockSocket = {
        id: 'socket-id-123',
        handshake: {
            auth: { token: 'valid-token' },
            headers: {},
        },
        disconnect: jest.fn(),
        join: jest.fn(),
        leave: jest.fn(),
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
        userId: '60a6c8b8b4f1a8001f6b1234',
        user: mockUser,
    };
    beforeEach(async () => {
        const mockJwt = {
            verify: jest.fn(),
        };
        const mockUsers = {
            findOne: jest.fn(),
            updateStatus: jest.fn(),
        };
        const mockChats = {
            findAll: jest.fn(),
            findOne: jest.fn(),
        };
        const mockMessages = {
            create: jest.fn(),
            markChatMessagesAsRead: jest.fn(),
            markAsRead: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                socket_gateway_1.SocketGateway,
                { provide: jwt_1.JwtService, useValue: mockJwt },
                { provide: users_service_1.UsersService, useValue: mockUsers },
                { provide: chats_service_1.ChatsService, useValue: mockChats },
                { provide: messages_service_1.MessagesService, useValue: mockMessages },
            ],
        }).compile();
        gateway = module.get(socket_gateway_1.SocketGateway);
        mockJwtService = module.get(jwt_1.JwtService);
        mockUsersService = module.get(users_service_1.UsersService);
        mockChatsService = module.get(chats_service_1.ChatsService);
        mockMessagesService = module.get(messages_service_1.MessagesService);
        gateway.server = {
            emit: jest.fn(),
            to: jest.fn().mockReturnThis(),
        };
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('handleConnection', () => {
        it('should authenticate and connect user', async () => {
            mockJwtService.verify.mockReturnValue({ sub: '60a6c8b8b4f1a8001f6b1234' });
            mockUsersService.findOne.mockResolvedValue(mockUser);
            mockUsersService.updateStatus.mockResolvedValue(mockUser);
            mockChatsService.findAll.mockResolvedValue([]);
            await gateway.handleConnection(mockSocket);
            expect(mockJwtService.verify).toHaveBeenCalledWith('valid-token');
            expect(mockUsersService.findOne).toHaveBeenCalledWith('60a6c8b8b4f1a8001f6b1234');
            expect(mockUsersService.updateStatus).toHaveBeenCalledWith('60a6c8b8b4f1a8001f6b1234', 'online');
            expect(mockSocket.userId).toBe('60a6c8b8b4f1a8001f6b1234');
        });
        it('should disconnect socket without token', async () => {
            const socketWithoutToken = {
                ...mockSocket,
                handshake: { auth: {}, headers: {} },
            };
            await gateway.handleConnection(socketWithoutToken);
            expect(socketWithoutToken.disconnect).toHaveBeenCalled();
        });
        it('should disconnect socket with invalid token', async () => {
            mockJwtService.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });
            await gateway.handleConnection(mockSocket);
            expect(mockSocket.disconnect).toHaveBeenCalled();
        });
    });
    describe('handleDisconnect', () => {
        it('should update user status to offline on disconnect', async () => {
            mockSocket.userId = '60a6c8b8b4f1a8001f6b1234';
            mockUsersService.updateStatus.mockResolvedValue(mockUser);
            await gateway.handleDisconnect(mockSocket);
            expect(mockUsersService.updateStatus).toHaveBeenCalledWith('60a6c8b8b4f1a8001f6b1234', 'offline');
            expect(gateway.server.emit).toHaveBeenCalledWith('userStatusUpdate', {
                userId: '60a6c8b8b4f1a8001f6b1234',
                status: 'offline',
            });
        });
    });
    describe('handleMessage', () => {
        it('should send message successfully', async () => {
            const createMessageDto = {
                content: 'Hello World',
                chatId: '60a6c8b8b4f1a8001f6b9012',
                type: 'text',
            };
            const mockMessage = {
                _id: '60a6c8b8b4f1a8001f6b5555',
                content: 'Hello World',
                sender: mockUser,
            };
            mockMessagesService.create.mockResolvedValue(mockMessage);
            const result = await gateway.handleMessage(createMessageDto, mockSocket);
            expect(mockMessagesService.create).toHaveBeenCalledWith(createMessageDto, mockSocket.userId);
            expect(result).toEqual({ success: true, message: mockMessage });
        });
        it('should handle message creation error', async () => {
            const createMessageDto = {
                content: 'Hello World',
                chatId: '60a6c8b8b4f1a8001f6b9012',
                type: 'text',
            };
            mockMessagesService.create.mockRejectedValue(new Error('Chat not found'));
            const result = await gateway.handleMessage(createMessageDto, mockSocket);
            expect(result).toEqual({ success: false, error: 'Chat not found' });
        });
    });
    describe('handleJoinChat', () => {
        it('should join chat successfully', async () => {
            const data = { chatId: '60a6c8b8b4f1a8001f6b9012' };
            mockChatsService.findOne.mockResolvedValue({});
            mockMessagesService.markChatMessagesAsRead.mockResolvedValue();
            const result = await gateway.handleJoinChat(data, mockSocket);
            expect(mockChatsService.findOne).toHaveBeenCalledWith(data.chatId, mockSocket.userId);
            expect(mockSocket.join).toHaveBeenCalledWith(`chat-${data.chatId}`);
            expect(mockMessagesService.markChatMessagesAsRead).toHaveBeenCalledWith(data.chatId, mockSocket.userId);
            expect(result).toEqual({ success: true });
        });
        it('should handle join chat error', async () => {
            const data = { chatId: '60a6c8b8b4f1a8001f6b9012' };
            mockChatsService.findOne.mockRejectedValue(new Error('Forbidden'));
            const result = await gateway.handleJoinChat(data, mockSocket);
            expect(result).toEqual({ success: false, error: 'Forbidden' });
        });
    });
    describe('handleLeaveChat', () => {
        it('should leave chat successfully', async () => {
            const data = { chatId: '60a6c8b8b4f1a8001f6b9012' };
            const result = await gateway.handleLeaveChat(data, mockSocket);
            expect(mockSocket.leave).toHaveBeenCalledWith(`chat-${data.chatId}`);
            expect(result).toEqual({ success: true });
        });
    });
    describe('handleTyping', () => {
        it('should emit typing status to chat participants', async () => {
            const data = { chatId: '60a6c8b8b4f1a8001f6b9012', isTyping: true };
            await gateway.handleTyping(data, mockSocket);
            expect(mockSocket.to).toHaveBeenCalledWith(`chat-${data.chatId}`);
            expect(mockSocket.emit).toHaveBeenCalledWith('userTyping', {
                userId: mockSocket.userId,
                userName: mockSocket.user?.name,
                isTyping: data.isTyping,
            });
        });
    });
});
//# sourceMappingURL=socket.gateway.spec.js.map