"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketGateway = void 0;
const jwt_1 = require("@nestjs/jwt");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const chats_service_1 = require("../chats/chats.service");
const dto_1 = require("../messages/dto");
const messages_service_1 = require("../messages/messages.service");
const notifications_service_1 = require("../notifications/notifications.service");
const users_service_1 = require("../users/users.service");
let SocketGateway = class SocketGateway {
    constructor(jwtService, usersService, chatsService, messagesService, notificationsService) {
        this.jwtService = jwtService;
        this.usersService = usersService;
        this.chatsService = chatsService;
        this.messagesService = messagesService;
        this.notificationsService = notificationsService;
        this.connectedUsers = new Map();
        this.autoResponseEnabled = true;
        this.autoResponseDelay = 2000;
        this.autoResponseMessages = [
            'Thanks for your message! 🙂',
            "That's interesting! Tell me more.",
            "I'm an auto-responder for testing notifications 🤖",
            'How are you doing today?',
            "Great point! I hadn't thought of that.",
            'Thanks for sharing that with me!',
            'What do you think about that?',
            'That sounds awesome! 🎉',
            "I'm here to help test your notifications!",
            "Hope you're having a great day! ☀️",
        ];
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token);
            console.log('JWT payload:', payload);
            const user = await this.usersService.findOne(payload.sub);
            console.log('Found user:', user._id);
            client.userId = payload.sub;
            client.user = user;
            console.log('Set client.userId to:', client.userId);
            this.connectedUsers.set(payload.sub, client.id);
            await this.usersService.updateStatus(payload.sub, 'online');
            const userChats = await this.chatsService.findAll(payload.sub);
            userChats.forEach((chat) => {
                client.join(`chat-${chat._id}`);
            });
            this.server.emit('userStatusUpdate', {
                userId: payload.sub,
                status: 'online',
                user: {
                    id: user._id,
                    name: user.name,
                    avatar: user.avatar,
                },
            });
            console.log(`User ${user.name} connected with socket ${client.id}`);
        }
        catch (error) {
            console.error('WebSocket authentication error:', error);
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        console.log('Disconnect triggered for client:', client.id, 'userId:', client.userId);
        if (client.userId) {
            this.connectedUsers.delete(client.userId);
            await this.usersService.updateStatus(client.userId, 'offline');
            this.server.emit('userStatusUpdate', {
                userId: client.userId,
                status: 'offline',
            });
            console.log(`User ${client.userId} disconnected`);
        }
    }
    async handleMessage(createMessageDto, client) {
        try {
            const message = await this.messagesService.create(createMessageDto, client.userId);
            this.server
                .to(`chat-${createMessageDto.chatId}`)
                .emit('newMessage', message);
            await this.sendPushNotificationToChat(createMessageDto.chatId, client.userId, message);
            if (this.autoResponseEnabled) {
                setTimeout(async () => {
                    await this.sendAutoResponse(createMessageDto.chatId, client.userId);
                }, this.autoResponseDelay);
            }
            return { success: true, message };
        }
        catch (error) {
            console.error('Error sending message:', error);
            return { success: false, error: error.message };
        }
    }
    async handleJoinChat(data, client) {
        try {
            console.log(`User ${client.userId} trying to join chat ${data.chatId}`);
            console.log('Client auth state:', {
                userId: client.userId,
                hasUser: !!client.user,
                userName: client.user?.name,
            });
            if (!client.userId || !client.user) {
                console.log('Client not authenticated yet, rejecting join request');
                return { success: false, error: 'Authentication required' };
            }
            await this.chatsService.findOne(data.chatId, client.userId);
            client.join(`chat-${data.chatId}`);
            await this.messagesService.markChatMessagesAsRead(data.chatId, client.userId);
            return { success: true };
        }
        catch (error) {
            console.error('Error joining chat:', error);
            return { success: false, error: error.message };
        }
    }
    async handleLeaveChat(data, client) {
        client.leave(`chat-${data.chatId}`);
        return { success: true };
    }
    async handleTyping(data, client) {
        client.to(`chat-${data.chatId}`).emit('userTyping', {
            userId: client.userId,
            userName: client.user?.name,
            isTyping: data.isTyping,
        });
    }
    async handleMarkMessageRead(data, client) {
        try {
            const message = await this.messagesService.markAsRead(data.messageId, client.userId);
            this.server.to(`chat-${message.chat}`).emit('messageRead', {
                messageId: data.messageId,
                readBy: client.userId,
                user: {
                    id: client.userId,
                    name: client.user?.name,
                },
            });
            return { success: true };
        }
        catch (error) {
            console.error('Error marking message as read:', error);
            return { success: false, error: error.message };
        }
    }
    async sendAutoResponse(chatId, originalSenderId) {
        try {
            const randomMessage = this.autoResponseMessages[Math.floor(Math.random() * this.autoResponseMessages.length)];
            const autoResponseDto = {
                chatId,
                content: randomMessage,
                type: 'text',
            };
            const botUser = await this.getOrCreateBotUser();
            const autoMessage = await this.messagesService.createBotMessage(autoResponseDto, botUser._id.toString());
            this.server.to(`chat-${chatId}`).emit('newMessage', autoMessage);
            await this.notificationsService.sendNotificationToUser(originalSenderId, 'New message from ChatBot', randomMessage, { chatId, messageId: autoMessage._id });
            console.log(`Auto-response sent to chat ${chatId}: ${randomMessage}`);
        }
        catch (error) {
            console.error('Error sending auto-response:', error);
        }
    }
    async getOrCreateBotUser() {
        try {
            const existingBot = await this.usersService.findByEmail('chatbot@angular-chat.com');
            if (existingBot) {
                return existingBot;
            }
        }
        catch (error) {
        }
        return await this.usersService.create({
            name: 'ChatBot',
            email: 'chatbot@angular-chat.com',
            password: 'bot-password-not-used',
            avatar: '🤖',
        });
    }
    async sendPushNotificationToChat(chatId, senderId, message) {
        try {
            const chat = await this.chatsService.findOne(chatId, senderId);
            const sender = await this.usersService.findOne(senderId);
            const otherParticipants = chat.participants.filter((participant) => participant._id.toString() !== senderId);
            const notificationPromises = otherParticipants.map(async (participant) => {
                const title = chat.isGroup ? `${chat.name}` : `${sender.name}`;
                const body = message.content;
                return this.notificationsService.sendNotificationToUser(participant._id.toString(), title, body, { chatId, messageId: message._id });
            });
            await Promise.allSettled(notificationPromises);
        }
        catch (error) {
            console.error('Error sending push notifications:', error);
        }
    }
    handleToggleAutoResponse(data, client) {
        this.autoResponseEnabled = data.enabled;
        return { success: true, autoResponseEnabled: this.autoResponseEnabled };
    }
    handleSetAutoResponseDelay(data, client) {
        this.autoResponseDelay = Math.max(1000, Math.min(10000, data.delay));
        return { success: true, autoResponseDelay: this.autoResponseDelay };
    }
};
exports.SocketGateway = SocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], SocketGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateMessageDto, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinChat'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleJoinChat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveChat'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleLeaveChat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('markMessageRead'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleMarkMessageRead", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('toggleAutoResponse'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SocketGateway.prototype, "handleToggleAutoResponse", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('setAutoResponseDelay'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SocketGateway.prototype, "handleSetAutoResponseDelay", null);
exports.SocketGateway = SocketGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: [
                'http://localhost:4200',
                'http://localhost:3000',
                'http://localhost:3001',
            ],
            methods: ['GET', 'POST'],
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        users_service_1.UsersService,
        chats_service_1.ChatsService,
        messages_service_1.MessagesService,
        notifications_service_1.NotificationsService])
], SocketGateway);
//# sourceMappingURL=socket.gateway.js.map